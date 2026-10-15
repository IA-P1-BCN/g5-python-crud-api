from datetime import UTC, datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace

import pytest
from sqlalchemy.exc import IntegrityError

from back.app.config.settings import settings
from back.app.controllers import booking as booking_controller
from back.app.models import Booking, Room, TimeSlot, User


@pytest.fixture
def seed(db):
    start = datetime(2030, 1, 1, 10, tzinfo=UTC)

    def slot(room, hours, status="available"):
        begin = start + timedelta(hours=hours)
        return TimeSlot(
            room_id=room.id,
            starts_at=begin,
            ends_at=begin + timedelta(hours=1),
            status=status,
        )

    user = User(name="Alice", email="alice@test.com")
    inactive_user = User(name="Bob", email="bob@test.com", is_active=False)
    room = Room(
        name="Pharaoh",
        slug="pharaoh",
        capacity=6,
        duration=60,
        base_price=Decimal("20.00"),
    )
    closed_room = Room(
        name="Closed",
        slug="closed",
        capacity=4,
        duration=60,
        base_price=Decimal("15.00"),
        status="inactive",
    )
    db.add_all([user, inactive_user, room, closed_room])
    db.flush()

    free_slot = slot(room, 0)
    blocked_slot = slot(room, 1, status="blocked")
    taken_slot = slot(room, 2)
    closed_room_slot = slot(closed_room, 0)
    db.add_all([free_slot, blocked_slot, taken_slot, closed_room_slot])
    db.flush()

    db.add(
        Booking(
            user_id=user.id,
            time_slot_id=taken_slot.id,
            players=2,
            total_price=Decimal("40.00"),
            status="PENDING",
        )
    )
    db.commit()

    return SimpleNamespace(
        user=user,
        inactive_user=inactive_user,
        room=room,
        free_slot=free_slot,
        blocked_slot=blocked_slot,
        taken_slot=taken_slot,
        closed_room_slot=closed_room_slot,
    )


URL = "/api/v1/bookings"
SLOT_INDEX_ERROR = (
    'duplicate key value violates unique constraint "uq_bookings_active_time_slot"'
)


def payload(user_id, slot_id, players=2):
    return {"user_id": user_id, "time_slot_id": slot_id, "players": players}


def test_create_booking_success(client, seed):
    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id, 2))

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["players"] == 2
    assert data["user_id"] == seed.user.id
    assert data["time_slot_id"] == seed.free_slot.id
    assert Decimal(data["total_price"]) == Decimal("40.00")


def test_create_booking_is_saved_in_database(client, seed, db):
    client.post(URL, json=payload(seed.user.id, seed.free_slot.id))

    assert db.query(Booking).count() == 2


def test_create_booking_unknown_slot_returns_404(client, seed):
    response = client.post(URL, json=payload(seed.user.id, 9999))

    assert response.status_code == 404
    assert response.json()["code"] == "SLOT_NOT_FOUND"


def test_create_booking_unknown_user_returns_404(client, seed):
    response = client.post(URL, json=payload(9999, seed.free_slot.id))

    assert response.status_code == 404
    assert response.json()["code"] == "USER_NOT_FOUND"


def test_create_booking_inactive_user_returns_409(client, seed):
    response = client.post(URL, json=payload(seed.inactive_user.id, seed.free_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "USER_INACTIVE"


def test_create_booking_inactive_room_returns_409(client, seed):
    response = client.post(URL, json=payload(seed.user.id, seed.closed_room_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "ROOM_INACTIVE"


def test_create_booking_blocked_slot_returns_409(client, seed):
    response = client.post(URL, json=payload(seed.user.id, seed.blocked_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_NOT_AVAILABLE"


def test_create_booking_already_booked_slot_returns_409(client, seed):
    response = client.post(URL, json=payload(seed.user.id, seed.taken_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_TAKEN"


def test_create_booking_concurrent_request_returns_409(client, seed, db, monkeypatch):

    def failing_commit():
        raise IntegrityError("INSERT", {}, Exception(SLOT_INDEX_ERROR))

    monkeypatch.setattr(db, "commit", failing_commit)

    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_TAKEN"
    assert db.query(Booking).count() == 1


def test_create_booking_zero_players_returns_422(client, seed):
    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id, 0))

    assert response.status_code == 422


def test_create_booking_more_players_than_capacity_returns_422(client, seed):
    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id, 7))

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PLAYERS"


def test_create_booking_missing_field_returns_422(client, seed):
    response = client.post(URL, json={"user_id": seed.user.id, "players": 2})

    assert response.status_code == 422


def test_list_bookings_returns_all(client, seed):
    response = client.get(URL)

    assert response.status_code == 200
    assert len(response.json()["items"]) == 1
    assert response.json()["total"] == 1


def test_list_bookings_filter_by_user(client, seed):
    assert len(client.get(URL, params={"user_id": seed.user.id}).json()["items"]) == 1
    other = client.get(URL, params={"user_id": seed.inactive_user.id}).json()
    assert other["items"] == []
    assert other["total"] == 0


def test_list_bookings_filter_by_status(client, seed):
    assert len(client.get(URL, params={"status": "PENDING"}).json()["items"]) == 1
    assert client.get(URL, params={"status": "CANCELLED"}).json()["items"] == []


def test_list_bookings_invalid_status_is_422(client, seed):
    assert client.get(URL, params={"status": "NOPE"}).status_code == 422


def test_get_booking_ok_includes_room_and_slot(client, seed):
    booking_id = client.get(URL).json()["items"][0]["id"]

    response = client.get(f"{URL}/{booking_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["room"]["name"] == "Pharaoh"
    assert data["time_slot"]["id"] == seed.taken_slot.id


def test_get_booking_not_found(client, seed):
    response = client.get(f"{URL}/9999")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def make_booking(db, seed, slot, status="PENDING", players=2):
    booking = Booking(
        user_id=seed.user.id,
        time_slot_id=slot.id,
        players=players,
        total_price=seed.room.base_price * players,
        status=status,
    )
    db.add(booking)
    db.commit()
    return booking


def test_update_booking_players_recalculates_price(client, seed, db):
    booking = db.query(Booking).one()

    response = client.put(f"{URL}/{booking.id}", json={"players": 3})

    assert response.status_code == 200
    data = response.json()
    assert data["players"] == 3
    assert Decimal(data["total_price"]) == Decimal("60.00")


def test_update_booking_too_late_returns_409(client, seed, db):
    begin = datetime.now(UTC) + timedelta(hours=2)
    soon_slot = TimeSlot(
        room_id=seed.room.id, starts_at=begin, ends_at=begin + timedelta(hours=1)
    )
    db.add(soon_slot)
    db.commit()
    booking = make_booking(db, seed, soon_slot)

    response = client.put(f"{URL}/{booking.id}", json={"players": 3})

    assert response.status_code == 409
    assert response.json()["code"] == "TOO_LATE_TO_MODIFY"


def test_update_booking_cancelled_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, status="CANCELLED")

    response = client.put(f"{URL}/{booking.id}", json={"players": 3})

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_update_booking_over_capacity_returns_422(client, seed, db):
    booking = db.query(Booking).one()

    response = client.put(f"{URL}/{booking.id}", json={"players": 7})

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PLAYERS"


SLOT_START = datetime(2030, 1, 1, 10, tzinfo=UTC)


def freeze_now(monkeypatch, now):
    monkeypatch.setattr(booking_controller, "_utcnow", lambda: now)


def test_cancel_booking_success(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"
    db.refresh(booking)
    assert booking.status == "CANCELLED"


def test_cancel_confirmed_booking_success(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, status="CONFIRMED")

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


def test_cancel_booking_frees_the_slot(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)
    client.put(f"{URL}/{booking.id}/cancel")

    response = client.post(URL, json=payload(seed.user.id, seed.free_slot.id))

    assert response.status_code == 201


def test_cancel_booking_exactly_24h_before_is_allowed(client, seed, db, monkeypatch):
    booking = make_booking(db, seed, seed.free_slot)
    freeze_now(monkeypatch, SLOT_START - timedelta(hours=24))

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


def test_cancel_booking_one_second_under_24h_returns_409(client, seed, db, monkeypatch):
    booking = make_booking(db, seed, seed.free_slot)
    freeze_now(monkeypatch, SLOT_START - timedelta(hours=24) + timedelta(seconds=1))

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 409
    assert response.json()["code"] == "TOO_LATE_TO_CANCEL"


def test_cancel_booking_under_24h_returns_409(client, seed, db):
    begin = datetime.now(UTC) + timedelta(hours=2)
    soon_slot = TimeSlot(
        room_id=seed.room.id, starts_at=begin, ends_at=begin + timedelta(hours=1)
    )
    db.add(soon_slot)
    db.commit()
    booking = make_booking(db, seed, soon_slot)

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 409
    assert response.json()["code"] == "TOO_LATE_TO_CANCEL"
    db.refresh(booking)
    assert booking.status == "PENDING"


def test_cancel_booking_twice_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)
    client.put(f"{URL}/{booking.id}/cancel")

    response = client.put(f"{URL}/{booking.id}/cancel")

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_cancel_booking_not_found(client, seed):
    response = client.put(f"{URL}/9999/cancel")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_confirm_booking_success(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(f"{URL}/{booking.id}/confirm")

    assert response.status_code == 200
    assert response.json()["status"] == "CONFIRMED"
    db.refresh(booking)
    assert booking.status == "CONFIRMED"


def test_confirm_cancelled_booking_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, status="CANCELLED")

    response = client.put(f"{URL}/{booking.id}/confirm")

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_confirm_already_confirmed_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, status="CONFIRMED")

    response = client.put(f"{URL}/{booking.id}/confirm")

    assert response.status_code == 409
    assert response.json()["code"] == "INVALID_TRANSITION"


def test_confirm_booking_not_found(client, seed):
    response = client.put(f"{URL}/9999/confirm")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def add_slot(db, room, begin, status="available"):
    slot = TimeSlot(
        room_id=room.id,
        starts_at=begin,
        ends_at=begin + timedelta(hours=1),
        status=status,
    )
    db.add(slot)
    db.commit()
    return slot


def add_room(db, name, capacity, base_price):
    room = Room(
        name=name,
        slug=name.lower().replace(" ", "-"),
        capacity=capacity,
        duration=60,
        base_price=Decimal(base_price),
    )
    db.add(room)
    db.commit()
    return room


LATER = datetime(2030, 1, 2, 10, tzinfo=UTC)


def test_change_slot_success_and_frees_old_slot(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)
    new_slot = add_slot(db, seed.room, LATER)

    response = client.put(f"{URL}/{booking.id}", json={"time_slot_id": new_slot.id})

    assert response.status_code == 200
    assert response.json()["time_slot_id"] == new_slot.id
    assert Decimal(response.json()["total_price"]) == Decimal("40.00")

    rebook = client.post(URL, json=payload(seed.user.id, seed.free_slot.id))
    assert rebook.status_code == 201


def test_change_slot_already_taken_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(
        f"{URL}/{booking.id}", json={"time_slot_id": seed.taken_slot.id}
    )

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_TAKEN"


def test_change_slot_too_late_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)
    soon_slot = add_slot(db, seed.room, datetime.now(UTC) + timedelta(hours=2))

    response = client.put(f"{URL}/{booking.id}", json={"time_slot_id": soon_slot.id})

    assert response.status_code == 409
    assert response.json()["code"] == "TOO_LATE_TO_MODIFY"


def test_change_slot_to_another_room_recalculates_price(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, players=2)
    other_room = add_room(db, "Mummy", capacity=8, base_price="30.00")
    other_slot = add_slot(db, other_room, LATER)

    response = client.put(f"{URL}/{booking.id}", json={"time_slot_id": other_slot.id})

    assert response.status_code == 200
    assert Decimal(response.json()["total_price"]) == Decimal("60.00")
    detail = client.get(f"{URL}/{booking.id}").json()
    assert detail["room"]["name"] == "Mummy"


def test_change_slot_to_smaller_room_returns_422(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, players=4)
    small_room = add_room(db, "Tiny", capacity=2, base_price="10.00")
    small_slot = add_slot(db, small_room, LATER)

    response = client.put(f"{URL}/{booking.id}", json={"time_slot_id": small_slot.id})

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PLAYERS"


def test_change_slot_blocked_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(
        f"{URL}/{booking.id}", json={"time_slot_id": seed.blocked_slot.id}
    )

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_NOT_AVAILABLE"


def test_change_slot_inactive_room_returns_409(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(
        f"{URL}/{booking.id}", json={"time_slot_id": seed.closed_room_slot.id}
    )

    assert response.status_code == 409
    assert response.json()["code"] == "ROOM_INACTIVE"


def test_change_slot_unknown_slot_returns_404(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(f"{URL}/{booking.id}", json={"time_slot_id": 9999})

    assert response.status_code == 404
    assert response.json()["code"] == "SLOT_NOT_FOUND"


def test_change_slot_and_players_together(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, players=2)
    new_slot = add_slot(db, seed.room, LATER)

    response = client.put(
        f"{URL}/{booking.id}", json={"time_slot_id": new_slot.id, "players": 3}
    )

    assert response.status_code == 200
    assert response.json()["players"] == 3
    assert Decimal(response.json()["total_price"]) == Decimal("60.00")


def test_update_booking_empty_body_returns_422(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(f"{URL}/{booking.id}", json={})

    assert response.status_code == 422


def test_change_slot_concurrent_request_returns_409(client, seed, db, monkeypatch):
    booking = make_booking(db, seed, seed.free_slot)
    new_slot = add_slot(db, seed.room, LATER)

    def failing_commit():
        raise IntegrityError("UPDATE", {}, Exception(SLOT_INDEX_ERROR))

    monkeypatch.setattr(db, "commit", failing_commit)

    response = client.put(f"{URL}/{booking.id}", json={"time_slot_id": new_slot.id})

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_TAKEN"


def test_update_players_only_too_late_returns_409(client, seed, db):
    soon_slot = add_slot(db, seed.room, datetime.now(UTC) + timedelta(hours=2))
    booking = make_booking(db, seed, soon_slot)

    response = client.put(f"{URL}/{booking.id}", json={"players": 3})

    assert response.status_code == 409
    assert response.json()["code"] == "TOO_LATE_TO_MODIFY"


def test_change_slot_to_same_slot_is_a_noop(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    response = client.put(
        f"{URL}/{booking.id}", json={"time_slot_id": seed.free_slot.id}
    )

    assert response.status_code == 200
    assert response.json()["time_slot_id"] == seed.free_slot.id


def test_get_booking_includes_nested_fields(client, seed):
    booking_id = client.get(URL).json()["items"][0]["id"]

    data = client.get(f"{URL}/{booking_id}").json()

    assert data["room"]["id"] == seed.room.id
    assert data["room"]["slug"] == "pharaoh"
    assert data["time_slot"]["starts_at"]
    assert data["time_slot"]["ends_at"]
    assert data["user"] == {"name": "Alice"}
    assert data["result"] is None


def test_list_bookings_includes_nested_fields(client, seed):
    item = client.get(URL).json()["items"][0]

    assert item["room"]["name"] == "Pharaoh"
    assert item["user"]["name"] == "Alice"
    assert item["can_modify"] is True


def test_can_modify_true_when_live_and_24h_away(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot)

    assert client.get(f"{URL}/{booking.id}").json()["can_modify"] is True


def test_can_modify_false_under_24h(client, seed, db):
    soon_slot = add_slot(db, seed.room, datetime.now(UTC) + timedelta(hours=2))
    booking = make_booking(db, seed, soon_slot)

    assert client.get(f"{URL}/{booking.id}").json()["can_modify"] is False


def test_can_modify_false_when_cancelled(client, seed, db):
    booking = make_booking(db, seed, seed.free_slot, status="CANCELLED")

    assert client.get(f"{URL}/{booking.id}").json()["can_modify"] is False


def test_list_bookings_filter_date_from(client, seed, db):
    make_booking(db, seed, add_slot(db, seed.room, LATER))

    data = client.get(URL, params={"date_from": "2030-01-02"}).json()["items"]

    assert len(data) == 1


def test_list_bookings_filter_date_to_is_inclusive(client, seed, db):
    make_booking(db, seed, add_slot(db, seed.room, LATER))

    only_first_day = client.get(URL, params={"date_to": "2030-01-01"}).json()["items"]
    both_days = client.get(URL, params={"date_to": "2030-01-02"}).json()["items"]

    assert len(only_first_day) == 1
    assert len(both_days) == 2


def test_list_bookings_cancelled_tab(client, seed, db):
    make_booking(db, seed, seed.free_slot, status="CANCELLED")

    data = client.get(URL, params={"status": "CANCELLED"}).json()["items"]

    assert len(data) == 1
    assert data[0]["can_modify"] is False


def test_list_bookings_invalid_date_returns_422(client, seed):
    assert client.get(URL, params={"date_from": "nope"}).status_code == 422


def test_booking_room_slug_is_the_stored_slug(client, seed, db):
    seed.room.slug = "custom-slug"
    db.flush()
    booking_id = client.get(URL).json()["items"][0]["id"]

    assert client.get(f"{URL}/{booking_id}").json()["room"]["slug"] == "custom-slug"
    assert client.get(URL).json()["items"][0]["room"]["slug"] == "custom-slug"


def test_list_bookings_date_from_after_date_to_returns_422(client, seed):
    response = client.get(
        URL, params={"date_from": "2030-01-05", "date_to": "2030-01-01"}
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def _add_bookings(db, seed, n):
    for i in range(n):
        make_booking(db, seed, add_slot(db, seed.room, LATER + timedelta(hours=2 * i)))


def test_list_bookings_second_page(client, seed, db):
    _add_bookings(db, seed, 4)

    body = client.get(URL, params={"page": 2, "size": 2}).json()

    assert body["total"] == 5
    assert body["page"] == 2 and body["size"] == 2
    assert len(body["items"]) == 2


def test_list_bookings_default_page_and_size(client, seed):
    body = client.get(URL).json()

    assert body["page"] == 1 and body["size"] == 20


def test_list_bookings_total_counts_filtered_rows_not_the_page(client, seed, db):
    _add_bookings(db, seed, 3)
    make_booking(
        db, seed, add_slot(db, seed.room, LATER + timedelta(days=1)), "CANCELLED"
    )

    body = client.get(URL, params={"status": "PENDING", "size": 2}).json()

    assert body["total"] == 4
    assert len(body["items"]) == 2


def test_list_bookings_filter_by_room(client, seed, db):
    other_room = Room(
        name="Other",
        slug="other",
        capacity=4,
        duration=60,
        base_price=Decimal("10.00"),
        status="active",
    )
    db.add(other_room)
    db.commit()
    make_booking(db, seed, add_slot(db, other_room, LATER))

    body = client.get(URL, params={"room_id": other_room.id}).json()

    assert body["total"] == 1
    assert body["items"][0]["room"]["id"] == other_room.id


@pytest.mark.parametrize("qs", ["page=0", "size=0", "size=101", "page=abc"])
def test_list_bookings_invalid_pagination_returns_422(client, seed, qs):
    assert client.get(f"{URL}?{qs}").status_code == 422


def test_create_booking_in_the_past_returns_409(client, seed, db):
    past_slot = add_slot(db, seed.room, datetime.now(UTC) - timedelta(days=3))

    response = client.post(URL, json=payload(seed.user.id, past_slot.id))

    assert response.status_code == 409
    assert response.json()["code"] == "SLOT_NOT_AVAILABLE"


def test_create_booking_unrelated_integrity_error_is_not_slot_taken(
    client, seed, db, monkeypatch
):
    def failing_commit():
        raise IntegrityError("INSERT", {}, Exception("violates foreign key constraint"))

    monkeypatch.setattr(db, "commit", failing_commit)

    with pytest.raises(IntegrityError):
        client.post(URL, json=payload(seed.user.id, seed.free_slot.id))


def test_active_slot_index_rejects_two_active_bookings(db, seed):
    make_booking(db, seed, seed.free_slot)

    with pytest.raises(IntegrityError):
        make_booking(db, seed, seed.free_slot)


def test_active_slot_index_allows_booking_after_cancellation(db, seed):
    make_booking(db, seed, seed.free_slot, status="CANCELLED")

    make_booking(db, seed, seed.free_slot)

    assert db.query(Booking).filter_by(time_slot_id=seed.free_slot.id).count() == 2


def _book_as(client, user, headers, slot):
    return client.post(URL, headers=headers, json=payload(user.id, slot.id, 2))


def test_client_cannot_exceed_active_bookings_limit(
    client, seed, db, client_user, monkeypatch
):
    monkeypatch.setattr(settings, "max_active_bookings", 2)
    user, headers = client_user
    slots = [add_slot(db, seed.room, LATER + timedelta(hours=3 * i)) for i in range(3)]

    assert _book_as(client, user, headers, slots[0]).status_code == 201
    assert _book_as(client, user, headers, slots[1]).status_code == 201
    response = _book_as(client, user, headers, slots[2])

    assert response.status_code == 409
    assert response.json()["code"] == "BOOKING_LIMIT_REACHED"


def test_cancelled_bookings_do_not_count_for_the_limit(
    client, seed, db, client_user, monkeypatch
):
    monkeypatch.setattr(settings, "max_active_bookings", 1)
    user, headers = client_user
    first, second = (
        add_slot(db, seed.room, LATER + timedelta(hours=3 * i)) for i in range(2)
    )
    db.add(
        Booking(
            user_id=user.id,
            time_slot_id=first.id,
            players=2,
            total_price=40,
            status="CANCELLED",
        )
    )
    db.commit()

    assert _book_as(client, user, headers, second).status_code == 201


def test_staff_and_admin_are_not_limited(client, seed, db, monkeypatch):
    monkeypatch.setattr(settings, "max_active_bookings", 1)
    slots = [add_slot(db, seed.room, LATER + timedelta(hours=3 * i)) for i in range(2)]

    for slot in slots:
        assert client.post(URL, json=payload(seed.user.id, slot.id)).status_code == 201


@pytest.fixture(autouse=True)
def _as_admin(client, admin_headers):
    client.headers.update(admin_headers)


def test_reading_a_booking_does_not_lock_the_row(client, seed, db, monkeypatch):
    booking = make_booking(db, seed, seed.free_slot)
    locks = []
    original_get = db.get

    def spy_get(entity, ident, **kwargs):
        locks.append(kwargs.get("with_for_update", False))
        return original_get(entity, ident, **kwargs)

    monkeypatch.setattr(db, "get", spy_get)

    assert client.get(f"{URL}/{booking.id}").status_code == 200
    assert not any(locks)

    assert client.put(f"{URL}/{booking.id}/confirm").status_code == 200
    assert locks[-1] is True


def test_history_of_unknown_user_returns_404(client):
    response = client.get("/api/v1/users/9999/history")

    assert response.status_code == 404
    assert response.json()["code"] == "USER_NOT_FOUND"


def test_create_booking_rejects_unknown_and_huge_values(client):
    body = {"user_id": 1, "time_slot_id": 1, "players": 2}

    assert client.post(URL, json={**body, "total_price": 0}).status_code == 422
    assert client.post(URL, json={**body, "players": 10**12}).status_code == 422
    assert client.post(URL, json={**body, "time_slot_id": 10**12}).status_code == 422
