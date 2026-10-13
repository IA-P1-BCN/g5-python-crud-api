from datetime import UTC, datetime, time, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from back.app.models.booking import Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot
from back.app.models.user import User


def test_create_time_slot_success(client: TestClient, db: Session):
    room = Room(
        name="Test Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="test-room",
        status="active",
    )
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
    room = Room(
        name="Inactive Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="inactive-room",
        status="inactive",
    )
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
    room = Room(
        name="Overlap Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="overlap-room",
        status="active",
    )
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
    room = Room(
        name="Update Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="update-room",
        status="active",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)
    slot = TimeSlot(
        room_id=room.id, starts_at=starts_at, ends_at=ends_at, status="available"
    )
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
    room = Room(
        name="Booking Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="booking-room",
        status="active",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    user = User(name="Test User", email="test@escape.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    starts_at = datetime.now(UTC) + timedelta(days=1)
    ends_at = starts_at + timedelta(hours=1)
    slot = TimeSlot(
        room_id=room.id, starts_at=starts_at, ends_at=ends_at, status="available"
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    booking = Booking(
        time_slot_id=slot.id,
        user_id=user.id,
        players=2,
        total_price=100.0,
        status="CONFIRMED",
    )
    db.add(booking)
    db.commit()

    response = client.delete(f"/api/v1/time-slots/{slot.id}")
    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_OVERLAP"


def test_delete_time_slot_success(client: TestClient, db: Session):
    room = Room(
        name="Delete Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="delete-room",
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


def _room_with_slots(
    db: Session, statuses: list[str | None]
) -> tuple[Room, list[TimeSlot]]:
    room = Room(
        name="Get Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="get-room",
        status="active",
    )
    user = User(name="Test User", email="get@escape.com")
    db.add_all([room, user])
    db.commit()
    day = datetime(2099, 1, 1, 10, tzinfo=UTC)
    slots = []
    for i, booking_status in enumerate(statuses):
        slot = TimeSlot(
            room_id=room.id,
            starts_at=day + timedelta(hours=2 * i),
            ends_at=day + timedelta(hours=2 * i + 1),
            status="available",
        )
        db.add(slot)
        db.commit()
        if booking_status:
            db.add(
                Booking(
                    time_slot_id=slot.id,
                    user_id=user.id,
                    players=2,
                    total_price=100.0,
                    status=booking_status,
                )
            )
            db.commit()
        slots.append(slot)
    return room, slots


def test_list_time_slots_available_filter(client: TestClient, db: Session):
    room, slots = _room_with_slots(db, [None, "CONFIRMED", "PENDING", "CANCELLED"])

    response = client.get(
        f"/api/v1/time-slots/?room_id={room.id}&date=2099-01-01&available=true"
    )

    assert response.status_code == 200
    ids = [s["id"] for s in response.json()]
    assert ids == [slots[0].id, slots[3].id]
    assert all(s["is_bookable"] for s in response.json())


def test_list_time_slots_date_filter_excludes_other_days(
    client: TestClient, db: Session
):
    room, _ = _room_with_slots(db, [None])

    response = client.get(f"/api/v1/time-slots/?room_id={room.id}&date=2099-01-02")

    assert response.status_code == 200
    assert response.json() == []


def test_get_time_slot_exposes_is_bookable(client: TestClient, db: Session):
    _, slots = _room_with_slots(db, [None, "PENDING"])

    free = client.get(f"/api/v1/time-slots/{slots[0].id}")
    taken = client.get(f"/api/v1/time-slots/{slots[1].id}")

    assert free.json()["is_bookable"] is True
    assert taken.json()["is_bookable"] is False


def test_get_time_slot_not_found(client: TestClient):
    assert client.get("/api/v1/time-slots/999999").status_code == 404


def test_update_time_slot_invalid_status(client: TestClient, db: Session):
    _, slots = _room_with_slots(db, [None])

    response = client.put(f"/api/v1/time-slots/{slots[0].id}", json={"status": "foo"})

    assert response.status_code == 422


def test_is_bookable_false_with_in_progress_booking():
    slot = TimeSlot(status="available", bookings=[Booking(status="IN_PROGRESS")])

    assert slot.is_bookable is False


def test_create_time_slot_in_the_past(client: TestClient, db: Session):
    room = Room(
        name="Past Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="past-room",
        status="active",
    )
    db.add(room)
    db.commit()
    starts_at = datetime.now(UTC) - timedelta(days=1)

    response = client.post(
        "/api/v1/time-slots/",
        json={
            "room_id": room.id,
            "starts_at": starts_at.isoformat(),
            "ends_at": (starts_at + timedelta(hours=1)).isoformat(),
        },
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_bulk_generate_time_slots_one_day(client: TestClient, db: Session):
    room = Room(
        name="Bulk Room One Day",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="bulk-room-one-day",
        status="active",
        genre="Mystery",
        min_players=2,
        difficulty=3,
        hook="A thrilling test",
        story="Long story...",
        audience="Adults",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    tomorrow_date = (datetime.now(UTC) + timedelta(days=1)).date()
    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        json={
            "date_from": tomorrow_date.isoformat(),
            "date_to": tomorrow_date.isoformat(),
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["created_count"] > 0
    assert data["skipped_count"] == 0


def test_bulk_generate_time_slots_several_days(client: TestClient, db: Session):
    room = Room(
        name="Bulk Room Several Days",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="bulk-room-several-days",
        status="active",
        genre="Mystery",
        min_players=2,
        difficulty=3,
        hook="A thrilling test",
        story="Long story...",
        audience="Adults",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    day_from = (datetime.now(UTC) + timedelta(days=1)).date()
    day_to = (datetime.now(UTC) + timedelta(days=3)).date()
    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        json={
            "date_from": day_from.isoformat(),
            "date_to": day_to.isoformat(),
            "first_start": "10:00:00",
            "last_start": "11:30:00",  
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["created_count"] == 6  
    assert data["skipped_count"] == 0

def test_bulk_generate_time_slots_skips_existing_overlaps(client: TestClient, db: Session):
    room = Room(
        name="Bulk Room Overlaps",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="bulk-room-overlaps",
        status="active",
        genre="Mystery",
        min_players=2,
        difficulty=3,
        hook="A thrilling test",
        story="Long story...",
        audience="Adults",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    target_date = datetime.now(UTC) + timedelta(days=1)
    slot_start = datetime.combine(target_date.date(), time(10, 0), tzinfo=UTC)
    slot_end = slot_start + timedelta(minutes=60)

    existing_slot = TimeSlot(
        room_id=room.id,
        starts_at=slot_start,
        ends_at=slot_end,
        status="available",
    )
    db.add(existing_slot)
    db.commit()

    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        json={
            "date_from": target_date.date().isoformat(),
            "date_to": target_date.date().isoformat(),
            "first_start": "10:00:00",
            "last_start": "10:00:00",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["created_count"] == 0
    assert data["skipped_count"] == 1


def test_bulk_generate_time_slots_inactive_room(client: TestClient, db: Session):
    room = Room(
        name="Inactive Bulk Room",
        capacity=4,
        duration=60,
        base_price=50.00,
        slug="inactive-bulk-room",
        status="inactive",
        genre="Mystery",
        min_players=2,
        difficulty=3,
        hook="A thrilling test",
        story="Long story...",
        audience="Adults",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    tomorrow_date = (datetime.now(UTC) + timedelta(days=1)).date()
    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        json={
            "date_from": tomorrow_date.isoformat(),
            "date_to": tomorrow_date.isoformat(),
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 400
    assert response.json()["code"] == "ROOM_INACTIVE"