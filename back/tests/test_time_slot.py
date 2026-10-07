from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot


def test_create_time_slot_success(client: TestClient, db: Session):
    # Arrange: Crear una sala activa de prueba
    room = Room(name="Test Room", capacity=4, duration=60, base_price=50.00, status="active")
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)

    response = client.post(
        "/time-slots/",
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
    # Arrange: Sala inactiva
    room = Room(name="Inactive Room", capacity=4, duration=60, base_price=50.00, status="inactive")
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)

    response = client.post(
        "/time-slots/",
        json={
            "room_id": room.id,
            "starts_at": starts_at.isoformat(),
            "ends_at": ends_at.isoformat(),
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Room is inactive"


def test_create_time_slot_overlap(client: TestClient, db: Session):
    # Arrange: Sala activa y un time slot existente
    room = Room(name="Overlap Room", capacity=4, duration=60, base_price=50.00, status="active")
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=2)
    ends_at = starts_at + timedelta(hours=2)

    existing_slot = TimeSlot(
        room_id=room.id,
        starts_at=starts_at,
        ends_at=ends_at,
        status="available",
    )
    db.add(existing_slot)
    db.commit()

    # Intentar crear un slot que se solapa (empieza dentro del rango existente)
    overlap_starts = starts_at + timedelta(minutes=30)
    overlap_ends = ends_at + timedelta(minutes=30)

    response = client.post(
        "/time-slots/",
        json={
            "room_id": room.id,
            "starts_at": overlap_starts.isoformat(),
            "ends_at": overlap_ends.isoformat(),
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Time slot overlaps with an existing slot"


def test_delete_time_slot_success(client: TestClient, db: Session):
    # Arrange: Sala y slot libre
    room = Room(name="Delete Room", capacity=4, duration=60, base_price=50.00, status="active")
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

    response = client.delete(f"/time-slots/{slot.id}")
    assert response.status_code == 204