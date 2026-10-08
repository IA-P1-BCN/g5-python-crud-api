from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from back.app.models.booking import Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot
from back.app.models.user import User


def create_room(db: Session) -> Room:
    """Auxiliar para crear una habitación de prueba."""
    room = Room(
        name="Escape Room Alpha",
        capacity=6,
        duration=60,
        base_price=Decimal("30.00"),
        status="active",
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def create_slot(
    db: Session,
    room_id: int,
    is_booked: bool = False,
    is_blocked: bool = False,
    offset_hours: int = 1,
) -> TimeSlot:
    """Auxiliar para crear un time slot de prueba."""
    start = datetime.now(UTC) + timedelta(hours=offset_hours)
    end = start + timedelta(hours=1)
    slot = TimeSlot(
        room_id=room_id,
        starts_at=start,
        ends_at=end,
        is_booked=is_booked,
        is_blocked=is_blocked,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


def test_get_available_time_slots_returns_only_bookable(client, db):
    """AC1: GET /api/v1/time-slots?room_id=&date=&available=true returns only bookable slots."""
    room = create_room(db)
    today_str = datetime.now(UTC).strftime("%Y-%m-%d")

    slot_ok = create_slot(
        db, room_id=room.id, is_booked=False, is_blocked=False, offset_hours=1
    )
    create_slot(
        db, room_id=room.id, is_booked=True, is_blocked=False, offset_hours=3
    )

    response = client.get(
        f"/api/v1/time-slots?room_id={room.id}&date={today_str}&available=true"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == slot_ok.id
    assert data[0]["is_bookable"] is True


def test_time_slot_exposes_computed_is_bookable(client, db):
    """AC2: Each slot exposes computed is_bookable (BR-S5)."""
    room = create_room(db)
    slot = create_slot(db, room_id=room.id, is_booked=False, is_blocked=False)

    response = client.get(f"/api/v1/time-slots/{slot.id}")

    assert response.status_code == 200
    data = response.json()
    assert "is_bookable" in data
    assert data["is_bookable"] is True


def test_delete_time_slot_conflict_booking(client: TestClient, db: Session):
    """Verifica que no se pueda eliminar un time slot con reservas confirmadas."""
    room = create_room(db)
    user = User(name="Test User", email="test@escape.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)
    slot = TimeSlot(
        room_id=room.id,
        starts_at=starts_at,
        ends_at=ends_at,
        status="available",
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    booking = Booking(
        time_slot_id=slot.id,
        user_id=user.id,
        players=2,
        total_price=Decimal("100.00"),
        status="CONFIRMED",
    )
    db.add(booking)
    db.commit()

    response = client.delete(f"/api/v1/time-slots/{slot.id}")
    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_OVERLAP"


def test_delete_time_slot_success(client: TestClient, db: Session):
    """Verifica la eliminación correcta de un time slot."""
    room = Room(
        name="Delete Room",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        status="active",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=3)
    ends_at = starts_at + timedelta(hours=1)
    slot = TimeSlot(
        room_id=room.id,
        starts_at=starts_at,
        ends_at=ends_at,
        status="available",
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    response = client.delete(f"/api/v1/time-slots/{slot.id}")
    assert response.status_code == 204
    assert db.get(TimeSlot, slot.id) is None


def test_booked_or_blocked_slots_hidden_when_available_true(client, db):
    """AC3: Booked or blocked slots are not returned when available=true."""
    room = create_room(db)
    today_str = datetime.now(UTC).strftime("%Y-%m-%d")

    create_slot(
        db, room_id=room.id, is_booked=True, is_blocked=False, offset_hours=1
    )
    create_slot(
        db, room_id=room.id, is_booked=False, is_blocked=True, offset_hours=3
    )

    response = client.get(
        f"/api/v1/time-slots?room_id={room.id}&date={today_str}&available=true"
    )

    assert response.status_code == 200
    assert len(response.json()) == 0


def test_get_time_slot_by_id_and_404_if_missing(client, db):
    """AC4: GET /api/v1/time-slots/{id} returns one slot, 404 if missing."""
    room = create_room(db)
    slot = create_slot(db, room_id=room.id, is_booked=False, is_blocked=False)

    res_ok = client.get(f"/api/v1/time-slots/{slot.id}")
    assert res_ok.status_code == 200
    assert res_ok.json()["id"] == slot.id

    res_404 = client.get("/api/v1/time-slots/999999")
    assert res_404.status_code == 404
    assert res_404.json()["detail"] == "Time slot not found"