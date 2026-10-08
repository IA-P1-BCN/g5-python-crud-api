from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from back.app.models.booking import Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot
from back.app.models.user import User


def create_room(db: Session, status: str = "active") -> Room:
    """Helper to create a room for testing."""
    room = Room(
        name="Escape Room Alpha",
        capacity=6,
        duration=60,
        base_price=Decimal("30.00"),
        status=status,
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
    start_time: datetime | None = None,
) -> TimeSlot:
    """Helper to create a time slot for testing."""
    if start_time is None:
        start_time = datetime.now(UTC) + timedelta(hours=2)

    end_time = start_time + timedelta(hours=1)
    slot_status = "blocked" if is_blocked else "available"

    slot = TimeSlot(
        room_id=room_id,
        starts_at=start_time,
        ends_at=end_time,
        status=slot_status,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    if is_booked:
        user = db.query(User).first()
        if not user:
            user = User(name="Test User", email="test@escape.com")
            db.add(user)
            db.commit()
            db.refresh(user)

        booking = Booking(
            time_slot_id=slot.id,
            user_id=user.id,
            players=2,
            total_price=Decimal("100.00"),
            status="CONFIRMED",
        )
        db.add(booking)
        db.commit()
        db.refresh(slot)

    return slot


def test_get_available_time_slots_returns_only_bookable(client: TestClient, db: Session):
    """AC1: GET /api/v1/time-slots?room_id=&date=&available=true returns only bookable slots."""
    room = create_room(db)
    fixed_now = datetime.now(UTC)
    today_str = fixed_now.strftime("%Y-%m-%d")

    slot_ok = create_slot(
        db,
        room_id=room.id,
        is_booked=False,
        is_blocked=False,
        start_time=fixed_now + timedelta(hours=1),
    )
    create_slot(
        db,
        room_id=room.id,
        is_booked=True,
        is_blocked=False,
        start_time=fixed_now + timedelta(hours=3),
    )

    response = client.get(
        f"/api/v1/time-slots?room_id={room.id}&date={today_str}&available=true"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == slot_ok.id
    assert data[0]["is_bookable"] is True


def test_time_slot_exposes_computed_is_bookable(client: TestClient, db: Session):
    """AC2: Each slot exposes computed is_bookable (BR-S5)."""
    room = create_room(db)
    slot = create_slot(db, room_id=room.id, is_booked=False, is_blocked=False)

    response = client.get(f"/api/v1/time-slots/{slot.id}")

    assert response.status_code == 200
    data = response.json()
    assert "is_bookable" in data
    assert data["is_bookable"] is True


def test_delete_time_slot_conflict_booking(client: TestClient, db: Session):
    """Verify time slot deletion fails when active bookings exist."""
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
    """Verify successful deletion of a time slot."""
    room = create_room(db)
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


def test_create_time_slot_inactive_room(client: TestClient, db: Session):
    """Verify creation fails for an inactive room (ROOM_INACTIVE)."""
    room = create_room(db, status="inactive")
    starts = datetime.now(UTC) + timedelta(days=1)
    ends = starts + timedelta(hours=1)

    payload = {
        "room_id": room.id,
        "starts_at": starts.isoformat(),
        "ends_at": ends.isoformat(),
    }
    response = client.post("/api/v1/time-slots", json=payload)
    assert response.status_code == 409
    assert response.json()["code"] == "ROOM_INACTIVE"