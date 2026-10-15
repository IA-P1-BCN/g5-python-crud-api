from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from back.app.models import Room

URL = "/api/v1/rooms"


def test_update_room_success(client, db):
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
    response = client.put(
        f"{URL}/9999",
        json={"name": "Ghost Room", "capacity": 4, "duration": 60, "base_price": 50.00},
    )
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "NOT_FOUND"


def test_update_room_duplicate_name(client, db):
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
            "capacity": 0,
            "duration": 60,
            "base_price": 50.00,
        },
    )
    assert response.status_code == 422


def test_deactivate_room_success(client, db):
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
    assert data["code"] == "ROOM_HAS_BOOKINGS"


def test_deactivate_room_not_found(client):
    response = client.put(f"{URL}/9999/deactivate")
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "NOT_FOUND"


def test_list_rooms_all(client, db):
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
    data = response.json()["items"]
    assert len(data) >= 2


def test_list_rooms_filter_status(client, db):
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
    data = response.json()["items"]
    assert all(r["status"] == "active" for r in data)


def test_get_room_success(client, db):
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
    response = client.get(f"{URL}/9999")
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "NOT_FOUND"


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


def _create_room(client, **overrides) -> dict:
    payload = _room_payload(**overrides)
    payload.pop("slug", None)
    response = client.post(URL, json=payload)
    assert response.status_code == 201
    return response.json()


def test_ac_01_schema_defaults_and_fields(db):
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
    create = client.post(URL, json=_room_payload())
    assert create.status_code == 201
    assert create.json()["slug"] == "el-faro"

    listing = client.get(URL)
    assert any(r["slug"] == "el-faro" for r in listing.json()["items"])

    by_slug = client.get(f"{URL}/el-faro")
    assert by_slug.status_code == 200
    assert by_slug.json()["genre"] == "Horror"

    by_id = client.get(f"{URL}/{create.json()['id']}")
    assert by_id.status_code == 200

    edit = client.put(f"{URL}/{create.json()['id']}", json={"difficulty": 5})
    assert edit.status_code == 200
    assert edit.json()["difficulty"] == 5


def test_ac_03_duplicate_slug_returns_409(client):
    first = client.post(URL, json=_room_payload(name="Faro Unico", slug="faro-unico"))
    assert first.status_code == 201

    duplicate = client.post(
        URL, json=_room_payload(name="Faro Duplicado", slug="faro-unico")
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "DUPLICATE"


def test_ac_03_duplicate_name_returns_409(client):
    first = client.post(URL, json=_room_payload(name="Faro Twin", slug="faro-twin-1"))
    assert first.status_code == 201

    duplicate = client.post(
        URL, json=_room_payload(name="Faro Twin", slug="faro-twin-2")
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "DUPLICATE"


def test_ac_03_min_players_over_capacity_returns_422(client):
    response = client.post(
        URL, json=_room_payload(slug="faro-bad-min", capacity=5, min_players=6)
    )
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_ac_03_difficulty_out_of_range_returns_422(client):
    for difficulty in (0, 6):
        response = client.post(
            URL,
            json=_room_payload(slug=f"faro-diff-{difficulty}", difficulty=difficulty),
        )
        assert response.status_code == 422


def test_ac_03_invalid_slug_format_returns_422(client):
    response = client.post(URL, json=_room_payload(slug="Faro Uno"))
    assert response.status_code == 422


def test_ac_04_get_room_by_slug(client):
    payload = _room_payload(name="Faro Route", slug="faro-route")
    create = client.post(URL, json=payload)
    assert create.status_code == 201

    response = client.get(f"{URL}/faro-route")
    assert response.status_code == 200
    assert response.json()["slug"] == "faro-route"


def test_get_room_by_missing_slug_returns_404(client):
    response = client.get(f"{URL}/no-such-room")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_get_room_unicode_numeric_lookup_returns_404(client):
    response = client.get(f"{URL}/\u00b2")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_create_room_generates_slug_from_name(client):
    payload = _room_payload(name="Escape Room Alpha", slug=None)
    response = client.post(URL, json=payload)
    assert response.status_code == 201
    assert response.json()["slug"] == "escape-room-alpha"


def test_create_room_numeric_name_gets_lettered_slug(client):
    response = client.post(URL, json=_room_payload(name="1923", slug=None))
    assert response.status_code == 201
    assert response.json()["slug"] == "sala-1923"

    listing = client.get(URL)
    assert listing.status_code == 200
    assert any(r["slug"] == "sala-1923" for r in listing.json()["items"])


def test_create_room_rejects_digits_only_slug(client):
    response = client.post(URL, json=_room_payload(slug="1923"))
    assert response.status_code == 422


def test_list_rooms_survives_legacy_digits_only_slug(client, db):
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
    assert any(r["slug"] == "1923" for r in listing.json()["items"])


def test_create_room_requires_catalog_fields(client):
    minimal = {
        "name": "Minimal Room",
        "capacity": 4,
        "duration": 60,
        "base_price": 20.0,
    }
    response = client.post(URL, json=minimal)
    assert response.status_code == 422


def test_update_room_partial_preserves_other_fields(client, db):
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


def test_criterion_1_catalog_fields_and_defaults(client):
    response = client.post(
        "/api/v1/rooms",
        json={
            "name": "Sala de Prueba Catálogo",
            "capacity": 8,
            "duration": 60,
            "base_price": 20.00,
            "genre": "Terror",
            "min_players": 2,
            "difficulty": 4,
            "hook": "Un misterio oscuro...",
            "story": "Historia detallada de la sala...",
            "audience": "Adultos",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "sala-de-prueba-catalogo"
    assert data["genre"] == "Terror"
    assert data["min_players"] == 2
    assert data["difficulty"] == 4
    assert data["hook"] == "Un misterio oscuro..."
    assert data["story"] == "Historia detallada de la sala..."
    assert data["audience"] == "Adultos"


def test_criterion_2_crud_accepts_and_returns_catalog_fields(client):
    create_res = client.post(
        "/api/v1/rooms",
        json={
            "name": "Sala CRUD Completa",
            "capacity": 5,
            "duration": 60,
            "base_price": 25.00,
            "genre": "Aventura",
            "min_players": 1,
            "difficulty": 3,
            "hook": "Hook inicial",
            "story": "Story inicial",
            "audience": "Todo público",
        },
    )
    assert create_res.status_code == 201
    room_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/rooms/{room_id}")
    assert get_res.status_code == 200
    assert get_res.json()["genre"] == "Aventura"

    update_res = client.put(
        f"/api/v1/rooms/{room_id}",
        json={"genre": "Ciencia Ficción", "difficulty": 5},
    )
    assert update_res.status_code == 200
    assert update_res.json()["genre"] == "Ciencia Ficción"
    assert update_res.json()["difficulty"] == 5

    list_res = client.get("/api/v1/rooms")
    assert list_res.status_code == 200
    rooms = list_res.json()["items"]
    assert any(r["id"] == room_id and r["genre"] == "Ciencia Ficción" for r in rooms)


def test_criterion_3_business_validations_and_duplicate_slug(client):
    payload_base = {
        "capacity": 4,
        "duration": 60,
        "base_price": 20.00,
        "genre": "Misterio",
        "min_players": 2,
        "difficulty": 3,
        "hook": "Test hook",
        "story": "Test story",
        "audience": "General",
    }

    res1 = client.post(
        "/api/v1/rooms",
        json={**payload_base, "name": "Sala Única", "slug": "sala-unica"},
    )
    assert res1.status_code == 201

    res_dup = client.post(
        "/api/v1/rooms",
        json={**payload_base, "name": "Otra Sala", "slug": "sala-unica"},
    )
    assert res_dup.status_code == 409
    assert res_dup.json()["code"] == "DUPLICATE"

    res_min = client.post(
        "/api/v1/rooms",
        json={
            **payload_base,
            "name": "Sala Min Invalido",
            "capacity": 2,
            "min_players": 5,
        },
    )
    assert res_min.status_code == 422

    res_diff = client.post(
        "/api/v1/rooms",
        json={**payload_base, "name": "Sala Diff Invalida", "difficulty": 6},
    )
    assert res_diff.status_code == 422


def test_criterion_4_get_room_by_slug_routing(client):
    client.post(
        "/api/v1/rooms",
        json={
            "name": "El Faro",
            "slug": "faro",
            "capacity": 6,
            "duration": 60,
            "base_price": 30.00,
            "genre": "Suspense",
            "min_players": 2,
            "difficulty": 3,
            "hook": "Luz en la oscuridad",
            "story": "Historia del faro",
            "audience": "General",
        },
    )

    response = client.get("/api/v1/rooms/faro")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "faro"
    assert data["name"] == "El Faro"


def test_activate_room_success(client, db):
    room_id = _create_room(client, name="Sala para Activar")["id"]
    client.put(f"{URL}/{room_id}/deactivate")

    activate_res = client.put(f"{URL}/{room_id}/activate")
    assert activate_res.status_code == 200
    assert activate_res.json()["status"] == "active"
    assert db.get(Room, room_id).status == "active"


def test_activate_room_idempotent(client, db):
    room_id = _create_room(client, name="Sala Ya Activa")["id"]

    activate_res = client.put(f"{URL}/{room_id}/activate")
    assert activate_res.status_code == 200
    assert activate_res.json()["status"] == "active"
    assert db.get(Room, room_id).status == "active"


def test_activate_room_with_past_bookings(client, db):
    from back.app.models import Booking, TimeSlot, User

    room_id = _create_room(client, name="Sala con Historial")["id"]
    client.put(f"{URL}/{room_id}/deactivate")

    user = User(email="history@example.com", name="Past Client")
    past = datetime.now(UTC) - timedelta(days=2)
    slot = TimeSlot(
        room_id=room_id,
        starts_at=past,
        ends_at=past + timedelta(minutes=60),
        status="available",
    )
    booking = Booking(
        user=user,
        time_slot=slot,
        players=2,
        total_price=Decimal("40.00"),
        status="CONFIRMED",
    )
    db.add_all([user, slot, booking])
    db.commit()

    activate_res = client.put(f"{URL}/{room_id}/activate")
    assert activate_res.status_code == 200
    assert activate_res.json()["status"] == "active"
    assert db.get(Room, room_id).status == "active"


def test_activate_room_not_found(client):
    activate_res = client.put("/api/v1/rooms/99999/activate")
    assert activate_res.status_code == 404
    assert activate_res.json()["code"] == "NOT_FOUND"


def test_room_response_exposes_is_active(client):
    room_id = _create_room(client, name="Sala Flag Activa")["id"]

    body = client.get(f"{URL}/{room_id}").json()

    assert body["status"] == "active"
    assert body["is_active"] is True


def test_room_response_is_active_false_when_deactivated(client, db):
    room_id = _create_room(client, name="Sala Flag Inactiva")["id"]
    client.put(f"{URL}/{room_id}/deactivate")

    body = client.get(f"{URL}/{room_id}").json()

    assert body["status"] == "inactive"
    assert body["is_active"] is False


def test_has_upcoming_slots_false_without_slots(client):
    room_id = _create_room(client, name="Sala Sin Slots")["id"]

    body = client.get(f"{URL}/{room_id}").json()

    assert body["has_upcoming_slots"] is False


def test_has_upcoming_slots_false_with_only_past_slots(client, db):
    from back.app.models import TimeSlot

    room_id = _create_room(client, name="Sala Solo Pasado")["id"]
    past = datetime.now(UTC) - timedelta(days=1)
    db.add(
        TimeSlot(
            room_id=room_id,
            starts_at=past,
            ends_at=past + timedelta(hours=1),
            status="available",
        )
    )
    db.commit()

    body = client.get(f"{URL}/{room_id}").json()

    assert body["has_upcoming_slots"] is False


def test_has_upcoming_slots_true_with_free_future_slot(client, db):
    from back.app.models import TimeSlot

    room_id = _create_room(client, name="Sala Libre Futuro")["id"]
    future = datetime.now(UTC) + timedelta(days=1)
    db.add(
        TimeSlot(
            room_id=room_id,
            starts_at=future,
            ends_at=future + timedelta(hours=1),
            status="available",
        )
    )
    db.commit()

    body = client.get(f"{URL}/{room_id}").json()

    assert body["has_upcoming_slots"] is True


def test_has_upcoming_slots_true_when_all_future_slots_taken(client, db):
    from back.app.models import Booking, TimeSlot, User

    room_id = _create_room(client, name="Sala Llena")["id"]
    user = User(email="full@example.com", name="Full Client")
    future = datetime.now(UTC) + timedelta(days=1)
    slot = TimeSlot(
        room_id=room_id,
        starts_at=future,
        ends_at=future + timedelta(hours=1),
        status="available",
    )
    booking = Booking(
        user=user,
        time_slot=slot,
        players=2,
        total_price=Decimal("20.00"),
        status="CONFIRMED",
    )
    db.add_all([user, slot, booking])
    db.commit()

    body = client.get(f"{URL}/{room_id}").json()

    assert body["has_upcoming_slots"] is True


def test_has_upcoming_slots_false_with_only_blocked_slots(client, db):
    from back.app.models import TimeSlot

    room_id = _create_room(client, name="Sala Bloqueada")["id"]
    future = datetime.now(UTC) + timedelta(days=1)
    db.add(
        TimeSlot(
            room_id=room_id,
            starts_at=future,
            ends_at=future + timedelta(hours=1),
            status="blocked",
        )
    )
    db.commit()

    body = client.get(f"{URL}/{room_id}").json()

    assert body["has_upcoming_slots"] is False


def test_list_rooms_default_pagination(client):
    for i in range(3):
        _create_room(client, name=f"Sala {i}")

    body = client.get(URL).json()

    assert body["page"] == 1 and body["size"] == 20 and body["total"] == 3
    assert len(body["items"]) == 3


def test_list_rooms_second_page(client):
    for i in range(5):
        _create_room(client, name=f"Sala {i}")

    body = client.get(f"{URL}?page=2&size=2").json()

    assert body["total"] == 5
    assert len(body["items"]) == 2


def test_list_rooms_status_filter_counts_only_matching(client):
    for i in range(3):
        room = _create_room(client, name=f"Sala {i}")
    client.put(f"{URL}/{room['id']}/deactivate")

    body = client.get(f"{URL}?status=active&size=1").json()

    assert body["total"] == 2
    assert len(body["items"]) == 1


@pytest.mark.parametrize("qs", ["page=0", "size=0", "size=101", "page=abc"])
def test_list_rooms_invalid_params_returns_422(client, qs):
    assert client.get(f"{URL}?{qs}").status_code == 422


@pytest.fixture(autouse=True)
def _as_admin(client, admin_headers):
    client.headers.update(admin_headers)


def _room_body(name="Race Room"):
    return {
        "name": name,
        "capacity": 4,
        "duration": 60,
        "base_price": 50,
        "slug": name.lower().replace(" ", "-"),
        "genre": "Mystery",
        "min_players": 2,
        "difficulty": 3,
        "hook": "hook",
        "story": "story",
        "audience": "everyone",
    }


def test_create_room_concurrent_duplicate_returns_409(client, db, monkeypatch):
    from sqlalchemy.exc import IntegrityError

    def failing_commit():
        raise IntegrityError(
            "INSERT", {}, Exception('violates unique constraint "uq_rooms_slug"')
        )

    monkeypatch.setattr(db, "commit", failing_commit)

    response = client.post(URL, json=_room_body())

    assert response.status_code == 409
    assert response.json()["code"] == "DUPLICATE"


def test_create_room_unrelated_integrity_error_is_raised(client, db, monkeypatch):
    from sqlalchemy.exc import IntegrityError

    def failing_commit():
        raise IntegrityError("INSERT", {}, Exception("violates check constraint"))

    monkeypatch.setattr(db, "commit", failing_commit)

    with pytest.raises(IntegrityError):
        client.post(URL, json=_room_body())


def test_update_room_capacity_below_active_booking_players_returns_409(client, db):
    from back.app.models import Booking, TimeSlot, User

    room = Room(
        name="Full Room",
        slug="full-room",
        capacity=6,
        duration=60,
        base_price=Decimal("50.00"),
    )
    user = User(email="cap@example.com", name="Cap")
    start = datetime.now(UTC) + timedelta(days=3)
    slot = TimeSlot(
        room=room,
        starts_at=start,
        ends_at=start + timedelta(hours=1),
        status="available",
    )
    booking = Booking(
        user=user,
        time_slot=slot,
        players=5,
        total_price=Decimal("250.00"),
        status="CONFIRMED",
    )
    db.add_all([room, user, slot, booking])
    db.commit()

    response = client.put(f"{URL}/{room.id}", json={"capacity": 4})

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_PLAYERS"
    db.refresh(room)
    assert room.capacity == 6


def test_list_rooms_rejects_unknown_status_filter(client):
    assert client.get(f"{URL}?status=banana").status_code == 422
