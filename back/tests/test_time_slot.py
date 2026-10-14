from datetime import UTC, datetime, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from back.app.models.booking import Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot
from back.app.models.user import User


@pytest.fixture
def login(db: Session, make_token):
    """Creates a user with the given role and returns auth headers for it."""

    def _login(role: str) -> dict[str, str]:
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

    # Create a real user using the correct model fields (name and email)
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

    starts_at = datetime.now(UTC) + timedelta(
        days=3
    )  # Use a different day to avoid overlaps
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
    """One room; one slot per entry (None = no booking, else booking status)."""
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
    items = response.json()["items"]
    assert [s["id"] for s in items] == [slots[0].id, slots[3].id]
    assert all(s["is_bookable"] for s in items)
    assert response.json()["total"] == 2


def test_list_time_slots_date_filter_excludes_other_days(
    client: TestClient, db: Session
):
    room, _ = _room_with_slots(db, [None])

    response = client.get(f"/api/v1/time-slots/?room_id={room.id}&date=2099-01-02")

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0


def test_list_time_slots_second_page(client: TestClient, db: Session):
    room, slots = _room_with_slots(db, [None] * 5)

    body = client.get(f"/api/v1/time-slots/?room_id={room.id}&page=2&size=2").json()

    assert body["total"] == 5
    assert [s["id"] for s in body["items"]] == [slots[2].id, slots[3].id]


def test_list_time_slots_available_total_counts_all_pages(
    client: TestClient, db: Session
):
    """The available filter runs in SQL: total ignores the page size."""
    room, slots = _room_with_slots(db, [None, "CONFIRMED", "PENDING", None, None])

    body = client.get(
        f"/api/v1/time-slots/?room_id={room.id}&available=true&page=2&size=2"
    ).json()

    assert body["total"] == 3
    assert [s["id"] for s in body["items"]] == [slots[4].id]


def test_list_time_slots_available_excludes_blocked(client: TestClient, db: Session):
    room, slots = _room_with_slots(db, [None, None])
    slots[1].status = "blocked"
    db.commit()

    body = client.get(f"/api/v1/time-slots/?room_id={room.id}&available=true").json()

    assert body["total"] == 1
    assert body["items"][0]["id"] == slots[0].id


@pytest.mark.parametrize("qs", ["page=0", "size=0", "size=101", "page=abc"])
def test_list_time_slots_invalid_pagination_returns_422(client: TestClient, qs):
    assert client.get(f"/api/v1/time-slots/?{qs}").status_code == 422


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


def test_bulk_generate_time_slots_one_day(client: TestClient, db: Session, login):
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
        headers=login("admin"),
        json={
            "date_from": tomorrow_date.isoformat(),
            "date_to": tomorrow_date.isoformat(),
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 200
    data = response.json()
    # duration 60 + 30 min buffer = 90 min step: starts at 09:00 and 10:30.
    assert data["created_count"] == 2
    assert data["skipped_count"] == 0


def test_bulk_generate_time_slots_several_days(client: TestClient, db: Session, login):
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
        headers=login("admin"),
        json={
            "date_from": day_from.isoformat(),
            "date_to": day_to.isoformat(),
            "first_start": "10:00:00",
            "last_start": "11:30:00",
        },
    )

    assert response.status_code == 200
    data = response.json()
    # 90 min step: 10:00 and 11:30, two slots per day over three days.
    assert data["created_count"] == 6
    assert data["skipped_count"] == 0


def test_bulk_generate_time_slots_skips_existing_overlaps(
    client: TestClient, db: Session, login
):
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
        headers=login("admin"),
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


def test_bulk_generate_time_slots_inactive_room(client: TestClient, db: Session, login):
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
        headers=login("admin"),
        json={
            "date_from": tomorrow_date.isoformat(),
            "date_to": tomorrow_date.isoformat(),
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 409
    assert response.json()["code"] == "ROOM_INACTIVE"


def _create_bulk_room(db: Session, *, status: str = "active", **overrides) -> Room:
    fields = {
        "name": "Bulk Room Base",
        "capacity": 4,
        "duration": 60,
        "base_price": 50.00,
        "slug": "bulk-room-base",
        "status": status,
        "genre": "Mystery",
        "min_players": 2,
        "difficulty": 3,
        "hook": "A thrilling test",
        "story": "Long story...",
        "audience": "Adults",
    }
    fields.update(overrides)
    room = Room(**fields)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


# --- Ticket 059: computed slot state and public day board ---


def _simple_room(db: Session, name: str, slug: str, status: str = "active") -> Room:
    room = Room(
        name=name,
        capacity=4,
        duration=60,
        base_price=50.00,
        slug=slug,
        status=status,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def test_slot_state_free(client: TestClient, db: Session):
    _, slots = _room_with_slots(db, [None])

    response = client.get(f"/api/v1/time-slots/{slots[0].id}")

    assert response.status_code == 200
    assert response.json()["state"] == "free"


def test_slot_state_taken(client: TestClient, db: Session):
    _, slots = _room_with_slots(db, ["CONFIRMED"])

    response = client.get(f"/api/v1/time-slots/{slots[0].id}")

    assert response.status_code == 200
    assert response.json()["state"] == "taken"


def test_slot_state_blocked(client: TestClient, db: Session):
    _, slots = _room_with_slots(db, [None])
    slots[0].status = "blocked"
    db.commit()

    response = client.get(f"/api/v1/time-slots/{slots[0].id}")

    assert response.status_code == 200
    assert response.json()["state"] == "blocked"


def test_slot_state_past(client: TestClient, db: Session):
    room = _simple_room(db, "Past State Room", "past-state-room")
    past = datetime.now(UTC) - timedelta(days=1)
    slot = TimeSlot(
        room_id=room.id,
        starts_at=past,
        ends_at=past + timedelta(hours=1),
        status="available",
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    response = client.get(f"/api/v1/time-slots/{slot.id}")

    assert response.status_code == 200
    assert response.json()["state"] == "past"


def test_slot_state_list_exposes_state_per_slot(client: TestClient, db: Session):
    room, _ = _room_with_slots(db, [None, "PENDING", "CANCELLED"])

    response = client.get(f"/api/v1/time-slots/?room_id={room.id}&date=2099-01-01")

    assert response.status_code == 200
    states = [slot["state"] for slot in response.json()["items"]]
    assert states == ["free", "taken", "free"]


def test_past_state_wins_over_blocked(client: TestClient, db: Session):
    room = _simple_room(db, "Past Blocked Room", "past-blocked-room")
    past = datetime.now(UTC) - timedelta(days=1)
    slot = TimeSlot(
        room_id=room.id,
        starts_at=past,
        ends_at=past + timedelta(hours=1),
        status="blocked",
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    response = client.get(f"/api/v1/time-slots/{slot.id}")

    assert response.json()["state"] == "past"


def test_public_day_board_hides_inactive_rooms(client: TestClient, db: Session):
    day = datetime(2099, 6, 1, 10, tzinfo=UTC)
    active = _simple_room(db, "Active Board", "active-board")
    inactive = _simple_room(
        db, "Inactive Board", "inactive-board", status="inactive"
    )
    db.add_all(
        [
            TimeSlot(
                room_id=active.id,
                starts_at=day,
                ends_at=day + timedelta(hours=1),
                status="available",
            ),
            TimeSlot(
                room_id=inactive.id,
                starts_at=day,
                ends_at=day + timedelta(hours=1),
                status="available",
            ),
        ]
    )
    db.commit()

    response = client.get("/api/v1/time-slots/?date=2099-06-01")

    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2099-06-01"
    room_ids = [entry["room"]["id"] for entry in data["rooms"]]
    assert room_ids == [active.id]
    assert data["rooms"][0]["room"]["is_active"] is True
    assert data["rooms"][0]["slots"][0]["state"] == "free"


def test_public_day_board_only_includes_that_day(client: TestClient, db: Session):
    room = _simple_room(db, "Board Day Room", "board-day-room")
    day = datetime(2099, 6, 2, 10, tzinfo=UTC)
    db.add(
        TimeSlot(
            room_id=room.id,
            starts_at=day,
            ends_at=day + timedelta(hours=1),
            status="available",
        )
    )
    db.commit()

    response = client.get("/api/v1/time-slots/?date=2099-06-03")

    assert response.status_code == 200
    assert response.json()["rooms"] == []


def test_bulk_generate_time_slots_room_not_found(
    client: TestClient, db: Session, login
):
    response = client.post(
        "/api/v1/rooms/999999/time-slots/generate",
        headers=login("admin"),
        json={
            "date_from": (datetime.now(UTC) + timedelta(days=1)).date().isoformat(),
            "date_to": (datetime.now(UTC) + timedelta(days=1)).date().isoformat(),
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_bulk_generate_time_slots_skips_past_dates(
    client: TestClient, db: Session, login
):
    room = _create_bulk_room(db, slug="bulk-room-past")

    yesterday = (datetime.now(UTC) - timedelta(days=1)).date()
    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        headers=login("admin"),
        json={
            "date_from": yesterday.isoformat(),
            "date_to": yesterday.isoformat(),
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["created_count"] == 0
    assert data["skipped_count"] == 2


def test_bulk_generate_time_slots_midnight_boundary(
    client: TestClient, db: Session, login
):
    """Regression: stepping with time() wrapped past midnight (infinite loop)."""
    room = _create_bulk_room(db, slug="bulk-room-midnight")

    tomorrow = (datetime.now(UTC) + timedelta(days=1)).date()
    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        headers=login("admin"),
        json={
            "date_from": tomorrow.isoformat(),
            "date_to": tomorrow.isoformat(),
            "first_start": "22:00:00",
            "last_start": "23:30:00",
        },
    )

    assert response.status_code == 200
    data = response.json()
    # 90 min step: 22:00 and 23:30, then the next candidate (01:00) is out of range.
    assert data["created_count"] == 2
    assert data["skipped_count"] == 0


def test_bulk_generate_time_slots_invalid_date_range(
    client: TestClient, db: Session, login
):
    room = _create_bulk_room(db, slug="bulk-room-bad-date")

    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        headers=login("admin"),
        json={
            "date_from": "2099-01-03",
            "date_to": "2099-01-01",
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_bulk_generate_time_slots_invalid_time_range(
    client: TestClient, db: Session, login
):
    room = _create_bulk_room(db, slug="bulk-room-bad-time")

    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        headers=login("admin"),
        json={
            "date_from": "2099-01-01",
            "date_to": "2099-01-01",
            "first_start": "12:00:00",
            "last_start": "09:00:00",
        },
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_bulk_generate_time_slots_requires_admin(client: TestClient, db: Session):
    client.headers.pop("Authorization", None)  # sin token: debe dar 401
    response = client.post(
        "/api/v1/rooms/1/time-slots/generate",
        json={
            "date_from": "2099-01-01",
            "date_to": "2099-01-01",
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


def test_bulk_generate_time_slots_forbidden_for_client(
    client: TestClient, db: Session, login
):
    response = client.post(
        "/api/v1/rooms/1/time-slots/generate",
        headers=login("client"),
        json={
            "date_from": "2099-01-01",
            "date_to": "2099-01-01",
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


def test_bulk_generate_time_slots_range_too_long(
    client: TestClient, db: Session, login
):
    room = _create_bulk_room(db, slug="bulk-room-too-long")

    start = datetime.now(UTC).date()
    response = client.post(
        f"/api/v1/rooms/{room.id}/time-slots/generate",
        headers=login("admin"),
        json={
            "date_from": start.isoformat(),
            "date_to": (start + timedelta(days=91)).isoformat(),
            "first_start": "09:00:00",
            "last_start": "11:00:00",
        },
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


@pytest.fixture(autouse=True)
def _as_admin(client, admin_headers):
    """Slots are admin-only (US05): act as admin unless a test sends its own headers."""
    client.headers.update(admin_headers)