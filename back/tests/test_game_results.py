from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import event
from sqlalchemy.exc import IntegrityError

from back.app.models import Booking, Room, TimeSlot, User

URL = "/api/v1/bookings/{}/result"
BODY = {"completed": True, "completion_time": 2540}


@pytest.fixture
def add_booking(db):
    room = Room(
        name="Pharaoh",
        slug="pharaoh",
        capacity=6,
        duration=60,
        base_price=Decimal("20.00"),
    )
    user = User(name="Player", email="player@test.com")
    begin = datetime.now(UTC).replace(microsecond=0)
    slot = TimeSlot(starts_at=begin, ends_at=begin + timedelta(hours=1), room=room)
    db.add_all([room, user, slot])
    db.flush()

    def _add(status="COMPLETED"):
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
def login(db, make_token):
    def _login(role):
        sub = f"auth-{role}"
        if db.query(User).filter_by(auth_id=sub).first():
            return {"Authorization": f"Bearer {make_token(subject=sub)}"}
        db.add(
            User(name=role.title(), email=f"{role}@test.com", role=role, auth_id=sub)
        )
        db.commit()
        return {"Authorization": f"Bearer {make_token(subject=sub)}"}

    return _login


def test_register_result_returns_201(client, login, add_booking):
    booking = add_booking()

    response = client.post(URL.format(booking.id), json=BODY, headers=login("staff"))

    assert response.status_code == 201
    assert response.json() == BODY


def test_register_result_requires_completed_booking(client, login, add_booking):
    booking = add_booking(status="IN_PROGRESS")

    response = client.post(URL.format(booking.id), json=BODY, headers=login("staff"))

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_register_result_only_once(client, login, add_booking):
    booking = add_booking()
    headers = login("staff")
    client.post(URL.format(booking.id), json=BODY, headers=headers)

    response = client.post(URL.format(booking.id), json=BODY, headers=headers)

    assert response.status_code == 409
    assert response.json()["code"] == "DUPLICATE"


def test_register_result_unknown_booking(client, login):
    response = client.post(URL.format(999), json=BODY, headers=login("staff"))

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_register_result_rejects_negative_time(client, login, add_booking):
    booking = add_booking()

    response = client.post(
        URL.format(booking.id),
        json={"completed": False, "completion_time": -1},
        headers=login("staff"),
    )

    assert response.status_code == 422


def test_register_result_forbidden_for_client(client, login, add_booking):
    booking = add_booking()

    response = client.post(URL.format(booking.id), json=BODY, headers=login("client"))

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


def test_booking_detail_shows_result(client, login, add_booking):
    booking = add_booking()
    admin = login("admin")
    client.post(URL.format(booking.id), json=BODY, headers=admin)

    response = client.get(f"/api/v1/bookings/{booking.id}", headers=admin)

    assert response.json()["result"] == BODY


def test_booking_detail_result_is_null_without_result(client, login, add_booking):
    booking = add_booking()

    response = client.get(f"/api/v1/bookings/{booking.id}", headers=login("admin"))

    assert response.json()["result"] is None


def test_list_bookings_loads_results_in_one_query(client, db, login, add_booking):
    for _ in range(3):
        add_booking()
    headers = login("admin")
    queries = []

    def count(conn, cursor, statement, *args):
        queries.append(statement)

    engine = db.get_bind()
    event.listen(engine, "before_cursor_execute", count)
    try:
        client.get("/api/v1/bookings", headers=headers)
    finally:
        event.remove(engine, "before_cursor_execute", count)

    assert len([q for q in queries if "FROM bookings" in q]) == 2


def test_register_result_unrelated_integrity_error_is_not_duplicate(
    client, db, login, add_booking, monkeypatch
):
    booking = add_booking()
    headers = login("staff")

    def failing_commit():
        raise IntegrityError("INSERT", {}, Exception("violates foreign key constraint"))

    monkeypatch.setattr(db, "commit", failing_commit)

    with pytest.raises(IntegrityError):
        client.post(URL.format(booking.id), json=BODY, headers=headers)


def test_register_result_concurrent_request_returns_duplicate(
    client, db, login, add_booking, monkeypatch
):
    booking = add_booking()
    headers = login("staff")

    def failing_commit():
        raise IntegrityError(
            "INSERT", {}, Exception("UNIQUE constraint failed: game_results.booking_id")
        )

    monkeypatch.setattr(db, "commit", failing_commit)

    response = client.post(URL.format(booking.id), json=BODY, headers=headers)

    assert response.status_code == 409
    assert response.json()["code"] == "DUPLICATE"
