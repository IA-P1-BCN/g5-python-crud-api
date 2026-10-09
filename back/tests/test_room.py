from datetime import UTC, datetime, timedelta
from decimal import Decimal

from back.app.models import Room

URL = "/api/v1/rooms"


def test_update_room_success(client, db):
    """Verify successful update of a room (200 OK)."""
    room = Room(
        name="Original Room",
        slug="original-room",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
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
    room1 = Room(
        name="Room A",
        slug="room-a",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
    )
    room2 = Room(
        name="Room B",
        slug="room-b",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
    )
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
    room = Room(
        name="Valid Room",
        slug="valid-room",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
    )
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
        slug="active-room",
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
        slug="room-with-booking",
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
        slug="room-1",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        status="active",
    )
    room2 = Room(
        name="Room 2",
        slug="room-2",
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
        slug="active-room-filter",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        status="active",
    )
    room2 = Room(
        name="Inactive Room",
        slug="inactive-room-filter",
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
        slug="specific-room",
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


# --- Ticket 056 Catalog Fields Acceptance Criteria Tests ---


def _room_payload(**overrides) -> dict:
    payload = {
        "name": "El Faro",
        "capacity": 6,
        "duration": 60,
        "base_price": 20.0,
        "slug": "el-faro",
        "genre": "Horror",
        "min_players": 2,
        "difficulty": 4,
        "hook": "Escape the island",
        "story": "A stormy night at the keeper lighthouse.",
        "audience": "16+",
    }
    payload.update(overrides)
    return payload


def test_ac_01_schema_defaults_and_fields(db):
    """AC-01: catalog columns exist and get their default values."""
    room = Room(
        name="Faro Defaults",
        slug="faro-defaults",
        capacity=6,
        duration=60,
        base_price=Decimal("15.00"),
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    assert room.slug == "faro-defaults"
    assert room.genre == "Misterio"
    assert room.min_players == 1
    assert room.difficulty == 3
    assert room.hook == ""
    assert room.story == ""
    assert room.audience == "Público general"


def test_ac_02_crud_catalog_fields(client):
    """AC-02: create / edit / get / list accept and return the new fields."""
    create = client.post(URL, json=_room_payload())
    assert create.status_code == 201
    assert create.json()["slug"] == "el-faro"

    listing = client.get(URL)
    assert any(r["slug"] == "el-faro" for r in listing.json())

    by_slug = client.get(f"{URL}/el-faro")
    assert by_slug.status_code == 200
    assert by_slug.json()["genre"] == "Horror"

    by_id = client.get(f"{URL}/{create.json()['id']}")
    assert by_id.status_code == 200

    edit = client.put(f"{URL}/{create.json()['id']}", json={"difficulty": 5})
    assert edit.status_code == 200
    assert edit.json()["difficulty"] == 5


def test_ac_03_duplicate_slug_returns_409(client):
    """AC-03: a repeated slug is rejected with 409 DUPLICATE."""
    first = client.post(URL, json=_room_payload(name="Faro Unico", slug="faro-unico"))
    assert first.status_code == 201

    duplicate = client.post(
        URL, json=_room_payload(name="Faro Duplicado", slug="faro-unico")
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "DUPLICATE"


def test_ac_03_duplicate_name_returns_409(client):
    """BR-R1: a repeated room name is rejected with 409 DUPLICATE."""
    first = client.post(URL, json=_room_payload(name="Faro Twin", slug="faro-twin-1"))
    assert first.status_code == 201

    duplicate = client.post(
        URL, json=_room_payload(name="Faro Twin", slug="faro-twin-2")
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "DUPLICATE"


def test_ac_03_min_players_over_capacity_returns_422(client):
    """AC-03 + BR-X1: min_players > capacity returns the project error shape."""
    response = client.post(
        URL, json=_room_payload(slug="faro-bad-min", capacity=5, min_players=6)
    )
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_ac_03_difficulty_out_of_range_returns_422(client):
    """AC-03: difficulty must be between 1 and 5."""
    for difficulty in (0, 6):
        response = client.post(
            URL,
            json=_room_payload(slug=f"faro-diff-{difficulty}", difficulty=difficulty),
        )
        assert response.status_code == 422


def test_ac_03_invalid_slug_format_returns_422(client):
    """AC-03: client-supplied slugs must be lowercase with hyphens only."""
    response = client.post(URL, json=_room_payload(slug="Faro Uno"))
    assert response.status_code == 422


def test_ac_04_get_room_by_slug(client):
    """AC-04: a room can be fetched by slug."""
    payload = _room_payload(name="Faro Route", slug="faro-route")
    create = client.post(URL, json=payload)
    assert create.status_code == 201

    response = client.get(f"{URL}/faro-route")
    assert response.status_code == 200
    assert response.json()["slug"] == "faro-route"


def test_get_room_by_missing_slug_returns_404(client):
    """A lookup by an unknown slug returns 404 NOT_FOUND."""
    response = client.get(f"{URL}/no-such-room")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_get_room_unicode_numeric_lookup_returns_404(client):
    """Unicode digits like \"²\" are not valid IDs or slugs."""
    response = client.get(f"{URL}/\u00b2")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_create_room_generates_slug_from_name(client):
    """A room created without a slug gets one generated from its name."""
    payload = _room_payload(name="Escape Room Alpha", slug=None)
    response = client.post(URL, json=payload)
    assert response.status_code == 201
    assert response.json()["slug"] == "escape-room-alpha"


def test_create_room_numeric_name_gets_lettered_slug(client):
    """A digits-only name must still produce a valid slug (BR: at least one letter)."""
    response = client.post(URL, json=_room_payload(name="1923", slug=None))
    assert response.status_code == 201
    assert response.json()["slug"] == "sala-1923"

    listing = client.get(URL)
    assert listing.status_code == 200
    assert any(r["slug"] == "sala-1923" for r in listing.json())


def test_create_room_rejects_digits_only_slug(client):
    """A client-supplied slug without any letter is rejected with 422."""
    response = client.post(URL, json=_room_payload(slug="1923"))
    assert response.status_code == 422


def test_list_rooms_survives_legacy_digits_only_slug(client, db):
    """A stored digits-only slug (pre-fix data) no longer breaks GET /rooms."""
    room = Room(
        name="Legacy 1923",
        slug="1923",
        capacity=4,
        duration=60,
        base_price=Decimal("20.00"),
        status="active",
    )
    db.add(room)
    db.commit()

    listing = client.get(URL)
    assert listing.status_code == 200
    assert any(r["slug"] == "1923" for r in listing.json())


def test_create_room_requires_catalog_fields(client):
    """The catalog fields are required when creating a room."""
    minimal = {
        "name": "Minimal Room",
        "capacity": 4,
        "duration": 60,
        "base_price": 20.0,
    }
    response = client.post(URL, json=minimal)
    assert response.status_code == 422


# --- Partial update regression tests ---


def test_update_room_partial_preserves_other_fields(client, db):
    """PUT with a single field keeps every stored value untouched."""
    room = Room(
        name="Partial Room",
        capacity=6,
        duration=60,
        base_price=Decimal("50.00"),
        slug="partial-room",
        genre="Misterio",
        min_players=2,
        difficulty=3,
        hook="h",
        story="s",
        audience="Todos",
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.put(f"{URL}/{room.id}", json={"difficulty": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["difficulty"] == 5
    assert data["name"] == "Partial Room"
    assert data["slug"] == "partial-room"
    assert data["capacity"] == 6
    assert data["min_players"] == 2
    assert data["genre"] == "Misterio"
    assert data["story"] == "s"


def test_update_room_rejects_null_for_not_null_columns(client, db):
    """Explicit NULL for a NOT NULL column returns 422, not a silent no-op."""
    room = Room(
        name="Keep Name",
        slug="keep-name",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        min_players=1,
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.put(f"{URL}/{room.id}", json={"name": None})
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_update_room_rejects_unknown_fields(client, db):
    """PUT ignores nothing: unknown fields (e.g. slug) return 422."""
    room = Room(
        name="Immutable Slug",
        slug="immutable-slug",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    response = client.put(f"{URL}/{room.id}", json={"slug": "new-slug"})
    assert response.status_code == 422


def test_update_room_partial_validates_effective_state(client, db):
    """BR-R7 is checked against stored + supplied values on partial updates."""
    room = Room(
        name="BR Room",
        capacity=4,
        duration=60,
        base_price=Decimal("50.00"),
        slug="br-room",
        min_players=2,
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    too_many_players = client.put(f"{URL}/{room.id}", json={"min_players": 5})
    assert too_many_players.status_code == 422
    assert too_many_players.json()["code"] == "VALIDATION_ERROR"

    capacity_below_min = client.put(f"{URL}/{room.id}", json={"capacity": 1})
    assert capacity_below_min.status_code == 422
    assert capacity_below_min.json()["code"] == "VALIDATION_ERROR"
