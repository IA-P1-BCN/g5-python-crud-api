from datetime import UTC, datetime, timedelta
from decimal import Decimal

from back.app.models import Room

URL = "/api/v1/rooms"


def test_update_room_success(client, db):
    """Verify successful update of a room (200 OK)."""
    room = Room(
        name="Original Room", capacity=4, duration=60, base_price=Decimal("50.00")
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.put(
        f"{URL}/{room.id}",
        json={
            "name": "Modified Room",
            "capacity": 6,
            "duration": 90,
            "base_price": 75.00,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Modified Room"
    assert data["capacity"] == 6
    assert data["duration"] == 90
    assert Decimal(str(data["base_price"])) == Decimal("75.00")


def test_update_room_not_found(client):
    """Verify that updating a non-existent room returns 404."""
    response = client.put(
        f"{URL}/9999",
        json={"name": "Ghost Room", "capacity": 4, "duration": 60, "base_price": 50.00},
    )
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "NOT_FOUND"


def test_update_room_duplicate_name(client, db):
    """Verify that renaming a room to an already existing name returns 409."""
    room1 = Room(name="Room A", capacity=4, duration=60, base_price=Decimal("50.00"))
    room2 = Room(name="Room B", capacity=4, duration=60, base_price=Decimal("50.00"))
    db.add_all([room1, room2])
    db.commit()
    db.refresh(room1)
    db.refresh(room2)

    response = client.put(
        f"{URL}/{room2.id}",
        json={"name": "Room A", "capacity": 4, "duration": 60, "base_price": 50.00},
    )
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "DUPLICATE"


def test_update_room_invalid_values(client, db):
    """Verify that invalid values (e.g., capacity < 1) return 422."""
    room = Room(name="Valid Room", capacity=4, duration=60, base_price=Decimal("50.00"))
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.put(
        f"{URL}/{room.id}",
        json={
            "name": "Invalid Room",
            "capacity": 0,  # Invalid
            "duration": 60,
            "base_price": 50.00,
        },
    )
    assert response.status_code == 422


def test_deactivate_room_success(client, db):
    """Verify successful deactivation of a room (200 OK)."""
    room = Room(
        name="Active Room",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        status="active",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.put(f"{URL}/{room.id}/deactivate")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "inactive"


def test_deactivate_room_conflict_future_bookings(client, db):
    """Verify that deactivating a room with future active bookings returns 409 (D-03)."""
    from back.app.models import Booking, TimeSlot, User

    room = Room(
        name="Room with Booking",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        status="active",
    )
    user = User(email="test@example.com", name="Test User")
    future_time = datetime.now(UTC) + timedelta(days=2)
    end_time = future_time + timedelta(minutes=room.duration)

    slot = TimeSlot(
        room=room, starts_at=future_time, ends_at=end_time, status="available"
    )
    booking = Booking(
        user=user,
        time_slot=slot,
        players=2,
        total_price=Decimal("100.00"),
        status="CONFIRMED",
    )

    db.add_all([room, user, slot, booking])
    db.commit()
    db.refresh(room)

    response = client.put(f"{URL}/{room.id}/deactivate")
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "CONFLICT"


def test_deactivate_room_not_found(client):
    """Verify that deactivating a non-existent room returns 404."""
    response = client.put(f"{URL}/9999/deactivate")
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "NOT_FOUND"


def test_list_rooms_all(client, db):
    """Verify listing all rooms returns 200 and the full list."""
    room1 = Room(
        name="Room 1",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        status="active",
    )
    room2 = Room(
        name="Room 2",
        capacity=6,
        duration=60,
        base_price=Decimal("70.00"),
        status="inactive",
    )
    db.add_all([room1, room2])
    db.commit()

    response = client.get(URL)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


def test_list_rooms_filter_status(client, db):
    """Verify filtering rooms by status=active works correctly."""
    room1 = Room(
        name="Active Room",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        status="active",
    )
    room2 = Room(
        name="Inactive Room",
        capacity=6,
        duration=60,
        base_price=Decimal("70.00"),
        status="inactive",
    )
    db.add_all([room1, room2])
    db.commit()

    response = client.get(f"{URL}?status=active")
    assert response.status_code == 200
    data = response.json()
    assert all(r["status"] == "active" for r in data)


def test_get_room_success(client, db):
    """Verify getting an existing room by ID returns 200."""
    room = Room(
        name="Specific Room",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        status="active",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.get(f"{URL}/{room.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == room.id
    assert data["name"] == "Specific Room"


def test_get_room_not_found(client):
    """Verify getting a non-existent room returns 404."""
    response = client.get(f"{URL}/9999")
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "NOT_FOUND"
