
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from back.app.models import Booking, Room, TimeSlot, User

API = "/api/v1"

ADMIN = ("admin",)
STAFF_UP = ("staff", "admin")

PROTECTED = [
    ("POST", f"{API}/users", ADMIN),
    ("GET", f"{API}/users", ADMIN),
    ("GET", f"{API}/users/999999", ADMIN),
    ("PUT", f"{API}/users/999999", ADMIN),
    ("PUT", f"{API}/users/999999/deactivate", ADMIN),
    ("PUT", f"{API}/users/999999/role", ADMIN),
    ("POST", f"{API}/rooms", ADMIN),
    ("PUT", f"{API}/rooms/999999", ADMIN),
    ("PUT", f"{API}/rooms/999999/deactivate", ADMIN),
    ("PUT", f"{API}/rooms/999999/activate", ADMIN),
    ("POST", f"{API}/rooms/999999/time-slots/generate", ADMIN),
    ("POST", f"{API}/time-slots/", ADMIN),
    ("PUT", f"{API}/time-slots/999999", ADMIN),
    ("DELETE", f"{API}/time-slots/999999", ADMIN),
    ("GET", f"{API}/bookings/today", STAFF_UP),
    ("PUT", f"{API}/bookings/999999/confirm", STAFF_UP),
    ("PUT", f"{API}/bookings/999999/start", STAFF_UP),
    ("PUT", f"{API}/bookings/999999/finish", STAFF_UP),
    ("POST", f"{API}/bookings/999999/result", STAFF_UP),
]
IDS = [f"{m} {u}" for m, u, _ in PROTECTED]


@pytest.fixture
def headers_by_role(admin_headers, staff_headers, client_headers):
    return {
        "admin": admin_headers,
        "staff": staff_headers,
        "client": client_headers,
    }


@pytest.mark.parametrize(("method", "url", "allowed"), PROTECTED, ids=IDS)
def test_without_token_returns_401(client, method, url, allowed):
    response = client.request(method, url, json={})

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


@pytest.mark.parametrize("role", ["client", "staff", "admin"])
@pytest.mark.parametrize(("method", "url", "allowed"), PROTECTED, ids=IDS)
def test_role_against_protected_endpoint(
    client, headers_by_role, method, url, allowed, role
):
    response = client.request(method, url, json={}, headers=headers_by_role[role])

    if role in allowed:
        assert response.status_code not in (401, 403)
    else:
        assert response.status_code == 403
        assert response.json()["code"] == "FORBIDDEN"




@pytest.fixture
def target_user(db):
    user = User(
        auth_id="target-sub", name="Target", email="target@example.com", role="client"
    )
    db.add(user)
    db.commit()
    return user


def test_admin_can_change_role(client, db, admin_headers, target_user):
    response = client.put(
        f"{API}/users/{target_user.id}/role",
        json={"role": "staff"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    db.expire_all()
    assert db.get(User, target_user.id).role == "staff"


@pytest.mark.parametrize("headers_name", ["client_headers", "staff_headers"])
def test_non_admin_cannot_change_role(client, db, request, target_user, headers_name):
    headers = request.getfixturevalue(headers_name)

    response = client.put(
        f"{API}/users/{target_user.id}/role", json={"role": "admin"}, headers=headers
    )

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"
    db.expire_all()
    assert db.get(User, target_user.id).role == "client"


def test_client_cannot_promote_themselves(client, db, client_user):
    user, headers = client_user

    response = client.put(
        f"{API}/users/{user.id}/role", json={"role": "admin"}, headers=headers
    )

    assert response.status_code == 403
    db.expire_all()
    assert db.get(User, user.id).role == "client"




@pytest.fixture
def bookings(db, client_user):
    owner, _ = client_user
    other = User(auth_id="other-sub", name="Other", email="other@example.com")
    room = Room(
        name="Pharaoh",
        slug="pharaoh",
        capacity=6,
        duration=60,
        base_price=Decimal("20.00"),
    )
    db.add_all([other, room])
    db.flush()

    def make(user, days):
        begin = datetime.now(UTC).replace(microsecond=0) + timedelta(days=days)
        slot = TimeSlot(
            room_id=room.id, starts_at=begin, ends_at=begin + timedelta(hours=1)
        )
        db.add(slot)
        db.flush()
        booking = Booking(
            user_id=user.id,
            time_slot_id=slot.id,
            players=2,
            total_price=Decimal("40.00"),
            status="PENDING",
        )
        db.add(booking)
        db.commit()
        return booking

    mine, theirs = make(owner, 3), make(other, 4)
    free_slot = TimeSlot(
        room_id=room.id,
        starts_at=datetime.now(UTC) + timedelta(days=5),
        ends_at=datetime.now(UTC) + timedelta(days=5, hours=1),
    )
    db.add(free_slot)
    db.commit()
    return {"mine": mine, "theirs": theirs, "other": other, "free_slot": free_slot}


def test_client_lists_only_own_bookings(client, client_headers, bookings):
    response = client.get(f"{API}/bookings", headers=client_headers)

    assert response.status_code == 200
    assert [b["id"] for b in response.json()["items"]] == [bookings["mine"].id]


def test_client_cannot_filter_by_other_user(client, client_headers, bookings):
    response = client.get(
        f"{API}/bookings",
        params={"user_id": bookings["other"].id},
        headers=client_headers,
    )

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.parametrize("headers_name", ["staff_headers", "admin_headers"])
def test_staff_and_admin_list_all_bookings(client, request, bookings, headers_name):
    headers = request.getfixturevalue(headers_name)

    response = client.get(f"{API}/bookings", headers=headers)

    assert response.status_code == 200
    assert {b["id"] for b in response.json()["items"]} == {
        bookings["mine"].id,
        bookings["theirs"].id,
    }


def test_client_gets_own_booking(client, client_headers, bookings):
    response = client.get(
        f"{API}/bookings/{bookings['mine'].id}", headers=client_headers
    )

    assert response.status_code == 200


def test_client_cannot_get_other_booking(client, client_headers, bookings):
    response = client.get(
        f"{API}/bookings/{bookings['theirs'].id}", headers=client_headers
    )

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


def test_staff_can_get_any_booking(client, staff_headers, bookings):
    response = client.get(
        f"{API}/bookings/{bookings['theirs'].id}", headers=staff_headers
    )

    assert response.status_code == 200


def test_client_cancels_own_booking(client, db, client_headers, bookings):
    response = client.put(
        f"{API}/bookings/{bookings['mine'].id}/cancel", headers=client_headers
    )

    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


def test_client_cannot_cancel_other_booking(client, db, client_headers, bookings):
    response = client.put(
        f"{API}/bookings/{bookings['theirs'].id}/cancel", headers=client_headers
    )

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"
    db.expire_all()
    assert db.get(Booking, bookings["theirs"].id).status == "PENDING"


def test_client_cannot_modify_other_booking(client, client_headers, bookings):
    response = client.put(
        f"{API}/bookings/{bookings['theirs'].id}",
        json={"players": 3},
        headers=client_headers,
    )

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


def test_staff_can_cancel_any_booking(client, staff_headers, bookings):
    response = client.put(
        f"{API}/bookings/{bookings['theirs'].id}/cancel", headers=staff_headers
    )

    assert response.status_code == 200


def test_client_cannot_book_for_someone_else(client, client_headers, bookings):
    response = client.post(
        f"{API}/bookings",
        json={
            "user_id": bookings["other"].id,
            "time_slot_id": bookings["free_slot"].id,
            "players": 2,
        },
        headers=client_headers,
    )

    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


def test_client_books_for_themselves(client, client_user, bookings):
    user, headers = client_user

    response = client.post(
        f"{API}/bookings",
        json={
            "user_id": user.id,
            "time_slot_id": bookings["free_slot"].id,
            "players": 2,
        },
        headers=headers,
    )

    assert response.status_code == 201
