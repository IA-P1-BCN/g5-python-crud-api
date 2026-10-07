from datetime import UTC, datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace

import pytest
from sqlalchemy.exc import IntegrityError

from back.app.controllers import booking as booking_controller
from back.app.models import Booking, Room, TimeSlot, User


@pytest.fixture
def seed(db):
    """Hardcoded data: one row per business rule we need to test."""
    start = datetime(2030, 1, 1, 10, tzinfo=UTC)

    def slot(room, hours, status="available"):
        begin = start + timedelta(hours=hours)
        return TimeSlot(
            room_id=room.id,
            starts_at=begin,
            ends_at=begin + timedelta(hours=1),
            status=status,
        )

    user = User(name="Alice", email="alice@test.com")
    inactive_user = User(name="Bob", email="bob@test.com", is_active=False)
    room = Room(name="Pharaoh", capacity=6, duration=60, base_price=Decimal("20.00"))
    closed_room = Room(
        name="Closed",
        capacity=4,
        duration=60,
        base_price=Decimal("15.00"),
        status="inactive",
    )
    db.add_all([user, inactive_user, room, closed_room])
    db.flush()

    free_slot = slot(room, 0)
    blocked_slot = slot(room, 1, status="blocked")
    taken_slot = slot(room, 2)
    closed_room_slot = slot(closed_room, 0)
    db.add_all([free_slot, blocked_slot, taken_slot, closed_room_slot])
    db.flush()

    db.add(
        Booking(
            user_id=user.id,
            time_slot_id=taken_slot.id,
            players=2,
            total_price=Decimal("40.00"),
            status="PENDING",
        )
    )
    db.commit()

    return SimpleNamespace(
        user=user,
        inactive_user=inactive_user,
        room=room,
        free_slot=free_slot,
        blocked_slot=blocked_slot,
        taken_slot=taken_slot,
        closed_room_slot=closed_room_slot,
    )


URL = "/api/v1/bookings"


def payload(user_id, slot_id, players=2):
    return {"user_id": user_id, "time_slot_id": slot_id, "players": players}


def test_create_booking_success(client, seed):
    """BR-B3 status is PENDING, BR-B4 total_price = base_price x players."""
    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id, 2))

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["players"] == 2
    assert data["user_id"] == seed.user.id
    assert data["time_slot_id"] == seed.free_slot.id
    assert Decimal(data["total_price"]) == Decimal("40.00")


def test_create_booking_is_saved_in_database(client, seed, db):
    client.post(URL, json=payload(seed.user.id, seed.free_slot.id))

    assert db.query(Booking).count() == 2


def test_create_booking_unknown_slot_returns_404(client, seed):
    response = client.post(URL, json=payload(seed.user.id, 9999))

    assert response.status_code == 404
    assert response.json()["code"] == "SLOT_NOT_FOUND"


def test_create_booking_unknown_user_returns_404(client, seed):
    response = client.post(URL, json=payload(9999, seed.free_slot.id))

    assert response.status_code == 404
    assert response.json()["code"] == "USER_NOT_FOUND"


def test_create_booking_inactive_user_returns_409(client, seed):
    """BR-U5."""
    response = client.post(URL, json=payload(seed.inactive_user.id, seed.free_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "USER_INACTIVE"


def test_create_booking_inactive_room_returns_409(client, seed):
    """BR-R4, BR-B1."""
    response = client.post(URL, json=payload(seed.user.id, seed.closed_room_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "ROOM_INACTIVE"


def test_create_booking_blocked_slot_returns_409(client, seed):
    """BR-S5, BR-B1."""
    response = client.post(URL, json=payload(seed.user.id, seed.blocked_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_NOT_AVAILABLE"


def test_create_booking_already_booked_slot_returns_409(client, seed):
    """BR-B1."""
    response = client.post(URL, json=payload(seed.user.id, seed.taken_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_TAKEN"


def test_create_booking_concurrent_request_returns_409(client, seed, db, monkeypatch):
    """BR-B8: the unique index rejects a request that passed the pre-check."""

    def failing_commit():
        raise IntegrityError("INSERT", {}, Exception("unique violation"))

    monkeypatch.setattr(db, "commit", failing_commit)

    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_TAKEN"
    # only the seed booking remains: the failed one was rolled back
    assert db.query(Booking).count() == 1


def test_create_booking_zero_players_returns_422(client, seed):
    """BR-B2 lower bound, checked by Pydantic."""
    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id, 0))

    assert response.status_code == 422


def test_create_booking_more_players_than_capacity_returns_422(client, seed):
    """BR-B2 upper bound: room capacity is 6, checked by the controller."""
    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id, 7))

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PLAYERS"


def test_create_booking_missing_field_returns_422(client, seed):
    response = client.post(URL, json={"user_id": seed.user.id, "players": 2})

    assert response.status_code == 422


def test_list_bookings_returns_all(client, seed):
    response = client.get(URL)

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_bookings_filter_by_user(client, seed):
    assert len(client.get(URL, params={"user_id": seed.user.id}).json()) == 1
    assert client.get(URL, params={"user_id": seed.inactive_user.id}).json() == []


def test_list_bookings_filter_by_status(client, seed):
    assert len(client.get(URL, params={"status": "PENDING"}).json()) == 1
    assert client.get(URL, params={"status": "CANCELLED"}).json() == []


def test_list_bookings_invalid_status_is_422(client, seed):
    assert client.get(URL, params={"status": "NOPE"}).status_code == 422


def test_get_booking_ok_includes_room_and_slot(client, seed):
    booking_id = client.get(URL).json()[0]["id"]

    response = client.get(f"{URL}/{booking_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["room"]["name"] == "Pharaoh"
    assert data["time_slot"]["id"] == seed.taken_slot.id


def test_get_booking_not_found(client, seed):
    response = client.get(f"{URL}/9999")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def make_booking(db, seed, slot, status="PENDING", players=2):
    """Insert a booking on the given slot and return it."""
    booking = Booking(
        user_id=seed.user.id,
        time_slot_id=slot.id,
        players=players,
        total_price=seed.room.base_price * players,
        status=status,
    )
    db.add(booking)
    db.commit()
    return booking


def test_update_booking_players_recalculates_price(client, seed, db):
    """BR-B7 happy path, BR-B4 total_price = base_price x players."""
    booking = db.query(Booking).one()

    response = client.put(f"{URL}/{booking.id}", json={"players": 3})

    assert response.status_code == 200
    data = response.json()
    assert data["players"] == 3
    assert Decimal(data["total_price"]) == Decimal("60.00")


def test_update_booking_too_late_returns_409(client, seed, db):
    """BR-B7: the slot starts in less than 24h."""
    begin = datetime.now(UTC) + timedelta(hours=2)
    soon_slot = TimeSlot(
        room_id=seed.room.id, starts_at=begin, ends_at=begin + timedelta(hours=1)
    )
    db.add(soon_slot)
    db.commit()
    booking = make_booking(db, seed, soon_slot)

    response = client.put(f"{URL}/{booking.id}", json={"players": 3})

    assert response.status_code == 409
    assert response.json()["code"] == "TOO_LATE_TO_MODIFY"


def test_update_booking_cancelled_returns_409(client, seed, db):
    """BR-B7: only PENDING or CONFIRMED bookings can be modified."""
    booking = make_booking(db, seed, seed.free_slot, status="CANCELLED")

    response = client.put(f"{URL}/{booking.id}", json={"players": 3})

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_update_booking_over_capacity_returns_422(client, seed, db):
    """BR-B2 upper bound: room capacity is 6."""
    booking = db.query(Booking).one()

    response = client.put(f"{URL}/{booking.id}", json={"players": 7})

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PLAYERS"


SLOT_START = datetime(2030, 1, 1, 10, tzinfo=UTC)


def freeze_now(monkeypatch, now):
    monkeypatch.setattr(booking_controller, "_utcnow", lambda: now)


def test_cancel_booking_success(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"
    db.refresh(booking)
    assert booking.status == "CANCELLED"


def test_cancel_confirmed_booking_success(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, status="CONFIRMED")

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


def test_cancel_booking_frees_the_slot(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)
    client.put(f"{URL}/{booking.id}/cancel")

    active_bookings = (
        db.query(Booking)
        .filter(
            Booking.time_slot_id == seed.free_slot.id,
            Booking.status.in_(booking_controller.ACTIVE_STATUSES),
        )
        .count()
    )

    assert active_bookings == 0


def test_cancel_booking_exactly_24h_before_is_allowed(client, seed, db, monkeypatch):
    booking = make_booking(db, seed, seed.free_slot)
    freeze_now(monkeypatch, SLOT_START - timedelta(hours=24))

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


def test_cancel_booking_one_second_under_24h_returns_409(client, seed, db, monkeypatch):
    booking = make_booking(db, seed, seed.free_slot)
    freeze_now(monkeypatch, SLOT_START - timedelta(hours=24) + timedelta(seconds=1))

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 409
    assert response.json()["code"] == "TOO_LATE_TO_CANCEL"


def test_cancel_booking_under_24h_returns_409(client, seed, db):
    begin = datetime.now(UTC) + timedelta(hours=2)
    soon_slot = TimeSlot(
        room_id=seed.room.id, starts_at=begin, ends_at=begin + timedelta(hours=1)
    )
    db.add(soon_slot)
    db.commit()
    booking = make_booking(db, seed, soon_slot)

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 409
    assert response.json()["code"] == "TOO_LATE_TO_CANCEL"
    db.refresh(booking)
    assert booking.status == "PENDING"


def test_cancel_booking_twice_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)
    client.put(f"{URL}/{booking.id}/cancel")

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_cancel_booking_not_found(client, seed):
    response = client.put(f"{URL}/9999/cancel")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_confirm_booking_success(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(f"{URL}/{booking.id}/confirm")

    assert response.status_code == 200
    assert response.json()["status"] == "CONFIRMED"
    db.refresh(booking)
    assert booking.status == "CONFIRMED"


def test_confirm_cancelled_booking_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, status="CANCELLED")

    response = client.put(f"{URL}/{booking.id}/confirm")

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_confirm_already_confirmed_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, status="CONFIRMED")

    response = client.put(f"{URL}/{booking.id}/confirm")

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_confirm_booking_not_found(client, seed):
    response = client.put(f"{URL}/9999/confirm")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"
