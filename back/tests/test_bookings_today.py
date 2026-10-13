from datetime import UTC, datetime, time, timedelta
from decimal import Decimal

import pytest

from back.app.models import Booking, Room, TimeSlot, User

URL = "/api/v1/bookings/today"
START_URL = "/api/v1/bookings/{}/start"


def day_at(offset_days: int, hour: int) -> datetime:
    today = datetime.now(UTC).date() + timedelta(days=offset_days)
    return datetime.combine(today, time(hour), tzinfo=UTC)


@pytest.fixture
def room(db):
    room = Room(
        name="Pharaoh",
        slug="pharaoh",
        capacity=6,
        duration=60,
        base_price=Decimal("20.00"),
    )
    db.add(room)
    db.commit()
    return room


@pytest.fixture
def add_booking(db, room):
    """Creates a slot (offset_days from today, at `hour` UTC) with one booking."""
    count = 0

    def _add(offset_days, hour, status="CONFIRMED"):
        nonlocal count
        count += 1
        user = User(name=f"User {count}", email=f"user{count}@test.com")
        begin = day_at(offset_days, hour)
        slot = TimeSlot(
            room_id=room.id, starts_at=begin, ends_at=begin + timedelta(hours=1)
        )
        db.add_all([user, slot])
        db.flush()
        booking = Booking(
            user_id=user.id,
            time_slot_id=slot.id,
            players=2,
            total_price=Decimal("40.00"),
            status=status,
        )
        db.add(booking)
        db.commit()
        return booking

    return _add


@pytest.fixture
def login(db, client, make_token):
    """Creates a user with the given role and returns auth headers for it."""

    def _login(role):
        sub = f"auth-{role}"
        db.add(
            User(
                name=role.title(),
                email=f"{role}@test.com",
                role=role,
                auth_id=sub,
            )
        )
        db.commit()
        return {"Authorization": f"Bearer {make_token(subject=sub)}"}

    return _login


def test_today_returns_only_todays_bookings(client, login, add_booking):
    today = add_booking(0, 14)
    add_booking(-1, 14)
    add_booking(1, 14)

    response = client.get(URL, headers=login("staff"))

    assert response.status_code == 200
    assert [b["id"] for b in response.json()] == [today.id]


def test_today_is_ordered_by_slot_start(client, login, add_booking):
    late = add_booking(0, 20)
    early = add_booking(0, 9)
    middle = add_booking(0, 15)

    response = client.get(URL, headers=login("staff"))

    assert [b["id"] for b in response.json()] == [early.id, middle.id, late.id]


def test_today_excludes_cancelled_bookings(client, login, add_booking):
    active = add_booking(0, 10)
    add_booking(0, 12, status="CANCELLED")

    response = client.get(URL, headers=login("staff"))

    assert [b["id"] for b in response.json()] == [active.id]


def test_today_allowed_for_admin(client, login):
    assert client.get(URL, headers=login("admin")).status_code == 200


def test_today_forbidden_for_client(client, login):
    response = client.get(URL, headers=login("client"))

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


def test_today_requires_authentication(client):
    assert client.get(URL).status_code == 401


def test_start_moves_confirmed_to_in_progress(client, login, add_booking):
    booking = add_booking(0, 14, status="CONFIRMED")

    response = client.put(START_URL.format(booking.id), headers=login("staff"))

    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


def test_start_rejects_booking_that_is_not_confirmed(client, login, add_booking):
    booking = add_booking(0, 14, status="PENDING")

    response = client.put(START_URL.format(booking.id), headers=login("staff"))

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_start_rejects_booking_on_another_day(client, login, add_booking):
    booking = add_booking(1, 14, status="CONFIRMED")

    response = client.put(START_URL.format(booking.id), headers=login("staff"))

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_start_unknown_booking_returns_404(client, login):
    response = client.put(START_URL.format(9999), headers=login("staff"))

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_start_forbidden_for_client(client, login, add_booking):
    booking = add_booking(0, 14, status="CONFIRMED")

    response = client.put(START_URL.format(booking.id), headers=login("client"))

    assert response.status_code == 403


def test_start_requires_authentication(client, add_booking):
    booking = add_booking(0, 14, status="CONFIRMED")

    assert client.put(START_URL.format(booking.id)).status_code == 401
