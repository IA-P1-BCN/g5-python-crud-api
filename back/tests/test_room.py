from decimal import Decimal

from back.app.models import Room

URL = "/api/v1/rooms"


def test_update_room_success(client, db):
    """Verify successful update of a room (200 OK)."""
    room = Room(name="Original Room", capacity=4, duration=60, base_price=Decimal("50.00"))
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.put(f"{URL}/{room.id}", json={
        "name": "Modified Room",
        "capacity": 6,
        "duration": 90,
        "base_price": 75.00
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Modified Room"
    assert data["capacity"] == 6
    assert data["duration"] == 90
    assert Decimal(str(data["base_price"])) == Decimal("75.00")


def test_update_room_not_found(client):
    """Verify that updating a non-existent room returns 404."""
    response = client.put(f"{URL}/9999", json={
        "name": "Ghost Room",
        "capacity": 4,
        "duration": 60,
        "base_price": 50.00
    })
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

    response = client.put(f"{URL}/{room2.id}", json={
        "name": "Room A",
        "capacity": 4,
        "duration": 60,
        "base_price": 50.00
    })
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "DUPLICATE"


def test_update_room_invalid_values(client, db):
    """Verify that invalid values (e.g., capacity < 1) return 422."""
    room = Room(name="Valid Room", capacity=4, duration=60, base_price=Decimal("50.00"))
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.put(f"{URL}/{room.id}", json={
        "name": "Invalid Room",
        "capacity": 0,  # Invalid
        "duration": 60,
        "base_price": 50.00
    })
    assert response.status_code == 422