from datetime import UTC, datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from back.app.models.booking import Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot


def test_create_time_slot_success(client: TestClient, db: Session):
    room = Room(name="Test Room", capacity=4, duration=60, base_price=50.00, status="active")
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)

    response = client.post(
        "/api/v1/time-slots/",
        json={
            "room_id": room.id,
            "starts_at": starts_at.isoformat(),
            "ends_at": ends_at.isoformat(),
            "status": "available",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["room_id"] == room.id
    assert data["status"] == "available"
    assert "id" in data


def test_create_time_slot_room_inactive(client: TestClient, db: Session):
    room = Room(name="Inactive Room", capacity=4, duration=60, base_price=50.00, status="inactive")
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)

    response = client.post(
        "/api/v1/time-slots/",
        json={
            "room_id": room.id,
            "starts_at": starts_at.isoformat(),
            "ends_at": ends_at.isoformat(),
            "status": "available",
        },
    )

    assert response.status_code == 409
    assert response.json()["code"] == "ROOM_INACTIVE"


def test_create_time_slot_overlap(client: TestClient, db: Session):
    room = Room(name="Overlap Room", capacity=4, duration=60, base_price=50.00, status="active")
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=2)

    existing_slot = TimeSlot(
        room_id=room.id,
        starts_at=starts_at,
        ends_at=ends_at,
        status="available",
    )
    db.add(existing_slot)
    db.commit()

    overlapping_start = starts_at + timedelta(hours=1)
    overlapping_end = ends_at + timedelta(hours=1)

    response = client.post(
        "/api/v1/time-slots/",
        json={
            "room_id": room.id,
            "starts_at": overlapping_start.isoformat(),
            "ends_at": overlapping_end.isoformat(),
            "status": "available",
        },
    )

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_OVERLAP"


def test_update_time_slot_success(client: TestClient, db: Session):
    room = Room(name="Update Room", capacity=4, duration=60, base_price=50.00, status="active")
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)
    slot = TimeSlot(room_id=room.id, starts_at=starts_at, ends_at=ends_at, status="available")
    db.add(slot)
    db.commit()
    db.refresh(slot)

    new_ends = ends_at + timedelta(hours=1)
    response = client.put(
        f"/api/v1/time-slots/{slot.id}",
        json={"ends_at": new_ends.isoformat(), "status": "blocked"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "blocked"


def test_delete_time_slot_with_active_booking(client: TestClient, db: Session):
    room = Room(name="Booking Room", capacity=4, duration=60, base_price=50.00, status="active")
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)
    slot = TimeSlot(room_id=room.id, starts_at=starts_at, ends_at=ends_at, status="available")
    db.add(slot)
    db.commit()
    db.refresh(slot)

    # Añadimos user_id, players y total_price para cumplir con todas las restricciones NOT NULL de bookings
    booking = Booking(time_slot_id=slot.id, user_id=1, players=2, total_price=100.0, status="CONFIRMED")
    db.add(booking)
    db.commit()

    response = client.delete(f"/api/v1/time-slots/{slot.id}")
    assert response.status_code == 409
    assert response.json()["code"] == "ACTIVE_BOOKING_EXISTS"
    
def test_delete_time_slot_success(client: TestClient, db: Session):
    room = Room(name="Delete Room", capacity=4, duration=60, base_price=50.00, status="active")
    db.add(room)
    db.commit()
    db.refresh(room)

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

    response = client.delete(f"/api/v1/time-slots/{slot.id}")

    assert response.status_code == 204
    assert db.get(TimeSlot, slot.id) is None