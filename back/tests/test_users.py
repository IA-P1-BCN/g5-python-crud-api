from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from back.app.models import Booking, GameResult, Room, TimeSlot, User

URL = "/api/v1/users"


def test_create_user_success(client, db, admin_headers):
    response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "phone": "+34123456789",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Alice"
    assert data["email"] == "alice@example.com"
    assert data["phone"] == "+34123456789"
    assert data["role"] == "client"
    assert data["is_active"] is True
    assert data["id"] is not None

    user = db.query(User).filter_by(email="alice@example.com").one()

    assert user.name == "Alice"
    assert user.email == "alice@example.com"
    assert user.phone == "+34123456789"
    assert user.role == "client"
    assert user.is_active is True


def test_create_user_duplicate_email_returns_409(client, admin_headers):
    first_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Another Alice",
            "email": "alice@example.com",
        },
    )

    assert second_response.status_code == 409
    assert second_response.json() == {
        "detail": "User with this email already exists",
        "code": "DUPLICATE",
    }


def test_create_user_email_is_normalized(client, db, admin_headers):
    first_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "Alice@example.com",
        },
    )

    assert first_response.status_code == 201
    assert first_response.json()["email"] == "alice@example.com"

    user = db.query(User).filter_by(email="alice@example.com").one()
    assert user.email == "alice@example.com"

    second_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Another Alice",
            "email": "ALICE@EXAMPLE.COM",
        },
    )

    assert second_response.status_code == 409
    assert second_response.json() == {
        "detail": "User with this email already exists",
        "code": "DUPLICATE",
    }


def test_create_user_invalid_email_returns_422(client, admin_headers):
    response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "not-an-email",
        },
    )

    assert response.status_code == 422


def test_create_user_missing_name_returns_422(client, admin_headers):
    response = client.post(
        URL,
        headers=admin_headers,
        json={
            "email": "alice@example.com",
        },
    )

    assert response.status_code == 422


def test_get_user_success(client, admin_headers):
    create_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "phone": "+34123456789",
        },
    )

    assert create_response.status_code == 201

    user_id = create_response.json()["id"]

    response = client.get(f"{URL}/{user_id}", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["id"] == user_id
    assert response.json()["name"] == "Alice"
    assert response.json()["email"] == "alice@example.com"
    assert response.json()["phone"] == "+34123456789"


def test_get_user_without_token_returns_401(client, admin_headers):
    create_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    response = client.get(f"{URL}/{user_id}")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Not authenticated",
        "code": "UNAUTHORIZED",
    }


def test_get_user_invalid_token_returns_401(client):
    response = client.get(
        f"{URL}/1",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Invalid or expired token",
        "code": "UNAUTHORIZED",
    }


def test_get_user_expired_token_returns_401(client, make_token):
    token = make_token(
        "google-user-123",
        expires_at=datetime.now(UTC) - timedelta(minutes=1),
    )

    response = client.get(
        f"{URL}/1",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Invalid or expired token",
        "code": "UNAUTHORIZED",
    }


def test_get_user_invalid_audience_returns_401(client, make_token):
    token = make_token(
        "google-user-123",
        audience="wrong-audience",
    )

    response = client.get(
        f"{URL}/1",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Invalid or expired token",
        "code": "UNAUTHORIZED",
    }


def test_get_user_not_found_returns_404(client, admin_headers):
    response = client.get(
        f"{URL}/999999",
        headers=admin_headers,
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "User not found",
        "code": "NOT_FOUND",
    }


def test_update_user_success(client, db, admin_headers):
    create_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "phone": "+34123456789",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    response = client.put(
        f"{URL}/{user_id}",
        headers=admin_headers,
        json={
            "name": "Alice Updated",
            "phone": "+34987654321",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == user_id
    assert data["name"] == "Alice Updated"
    assert data["phone"] == "+34987654321"
    assert data["email"] == "alice@example.com"

    user = db.get(User, user_id)

    assert user is not None
    assert user.name == "Alice Updated"
    assert user.phone == "+34987654321"
    assert user.email == "alice@example.com"


def test_update_user_invalid_data_returns_422(client, admin_headers):
    create_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    response = client.put(
        f"{URL}/{user_id}",
        headers=admin_headers,
        json={
            "name": "",
            "phone": "+34987654321",
        },
    )

    assert response.status_code == 422


def test_update_user_rejects_email_change(client, admin_headers):
    create_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "phone": "+34123456789",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    response = client.put(
        f"{URL}/{user_id}",
        headers=admin_headers,
        json={
            "name": "Alice Updated",
            "phone": "+34987654321",
            "email": "new@example.com",
        },
    )

    assert response.status_code == 422


def test_list_users_empty(client, admin_headers):
    response = client.get(URL, headers=admin_headers)

    assert response.status_code == 200
    assert [user["name"] for user in response.json()["items"]] == ["Test Admin"]
    assert response.json()["total"] == 1


def test_list_users(client, admin_headers):
    first_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    second_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Bob",
            "email": "bob@example.com",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get(URL, headers=admin_headers)

    assert response.status_code == 200

    data = response.json()["items"]

    assert len(data) == 3
    assert data[1]["name"] == "Alice"
    assert data[1]["email"] == "alice@example.com"
    assert data[2]["name"] == "Bob"
    assert data[2]["email"] == "bob@example.com"


def test_list_users_is_ordered_by_id(client, admin_headers):
    first_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    second_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Bob",
            "email": "bob@example.com",
        },
    )

    third_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Charlie",
            "email": "charlie@example.com",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert third_response.status_code == 201

    response = client.get(URL, headers=admin_headers)

    assert response.status_code == 200

    data = response.json()["items"]

    assert [user["id"] for user in data] == sorted(user["id"] for user in data)
    assert [user["name"] for user in data[1:]] == [
        "Alice",
        "Bob",
        "Charlie",
    ]


def test_deactivate_user(client, db, admin_headers):
    create_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    response = client.put(f"{URL}/{user_id}/deactivate", headers=admin_headers)

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == user_id
    assert data["is_active"] is False

    user = db.get(User, user_id)

    assert user is not None
    assert user.is_active is False


def test_deactivate_user_is_idempotent(client, db, admin_headers):
    create_response = client.post(
        URL,
        headers=admin_headers,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    first_response = client.put(f"{URL}/{user_id}/deactivate", headers=admin_headers)
    second_response = client.put(f"{URL}/{user_id}/deactivate", headers=admin_headers)

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert first_response.json()["is_active"] is False
    assert second_response.json()["is_active"] is False

    user = db.get(User, user_id)

    assert user is not None
    assert user.is_active is False


def test_deactivate_unknown_user_returns_404(client, admin_headers):
    response = client.put(f"{URL}/999999/deactivate", headers=admin_headers)

    assert response.status_code == 404
    assert response.json() == {
        "detail": "User not found",
        "code": "NOT_FOUND",
    }


def _history_setup(db, make_token):
    """Alice (client), Bob (client), Staff; Alice owns 2 slots."""
    alice = User(name="Alice", email="a@h.com", auth_id="alice-sub")
    bob = User(name="Bob", email="b@h.com", auth_id="bob-sub")
    staff = User(name="Sam", email="s@h.com", auth_id="staff-sub", role="staff")
    room = Room(
        name="Hist", slug="hist", capacity=6, duration=60, base_price=Decimal(20)
    )
    db.add_all([alice, bob, staff, room])
    db.commit()
    slots = []
    for day in (1, 2):
        begin = datetime(2030, 1, day, 10, tzinfo=UTC)
        slots.append(
            TimeSlot(
                room_id=room.id, starts_at=begin, ends_at=begin + timedelta(hours=1)
            )
        )
    db.add_all(slots)
    db.commit()
    return alice, bob, staff, slots


def _booking(db, user, slot, status="COMPLETED", result=True):
    b = Booking(
        user_id=user.id,
        time_slot_id=slot.id,
        players=2,
        total_price=Decimal("40.00"),
        status=status,
    )
    db.add(b)
    db.commit()
    if result:
        db.add(GameResult(booking_id=b.id, completed=True, completion_time=1800))
        db.commit()
    return b


def _auth(make_token, user):
    return {"Authorization": f"Bearer {make_token(subject=user.auth_id)}"}


def test_my_history_returns_only_completed_with_result(client, db, make_token):
    alice, _, _, (s1, s2) = _history_setup(db, make_token)
    _booking(db, alice, s1)
    _booking(db, alice, s2, status="PENDING", result=False)

    r = client.get(f"{URL}/me/history", headers=_auth(make_token, alice))

    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["result"] == {"completed": True, "completion_time": 1800}


def test_history_without_result_has_null_result(client, db, make_token):
    alice, _, _, (s1, _) = _history_setup(db, make_token)
    _booking(db, alice, s1, result=False)

    r = client.get(f"{URL}/me/history", headers=_auth(make_token, alice))

    assert r.status_code == 200
    assert r.json()[0]["result"] is None


def test_history_is_most_recent_first(client, db, make_token):
    alice, _, _, (s1, s2) = _history_setup(db, make_token)
    _booking(db, alice, s1)
    _booking(db, alice, s2)

    r = client.get(f"{URL}/{alice.id}/history", headers=_auth(make_token, alice))

    assert [b["time_slot"]["id"] for b in r.json()] == [s2.id, s1.id]


def test_history_of_other_user_is_403(client, db, make_token):
    alice, bob, _, _ = _history_setup(db, make_token)

    r = client.get(f"{URL}/{bob.id}/history", headers=_auth(make_token, alice))

    assert r.status_code == 403
    assert r.json()["code"] == "FORBIDDEN"


def test_staff_can_read_any_history(client, db, make_token):
    alice, _, staff, (s1, _) = _history_setup(db, make_token)
    _booking(db, alice, s1)

    r = client.get(f"{URL}/{alice.id}/history", headers=_auth(make_token, staff))

    assert r.status_code == 200
    assert len(r.json()) == 1


def test_admin_can_read_any_history(client, db, make_token):
    alice, _, _, (s1, _) = _history_setup(db, make_token)
    admin = User(
        name="Admin",
        email="admin-history@example.com",
        auth_id="admin-history-sub",
        role="admin",
    )
    db.add(admin)
    db.commit()
    _booking(db, alice, s1)

    response = client.get(
        f"{URL}/{alice.id}/history",
        headers=_auth(make_token, admin),
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_history_requires_authentication(client):
    assert client.get(f"{URL}/me/history").status_code == 401


def _make_users(client, headers, n):
    for i in range(n):
        client.post(
            URL, headers=headers, json={"email": f"u{i}@x.com", "name": f"U{i}"}
        )


def test_list_users_default_pagination(client, admin_headers):
    _make_users(client, admin_headers, 3)
    body = client.get(URL, headers=admin_headers).json()
    assert body["page"] == 1 and body["size"] == 20 and body["total"] == 4
    assert len(body["items"]) == 4


def test_list_users_second_page(client, admin_headers):
    _make_users(client, admin_headers, 5)
    body = client.get(f"{URL}?page=2&size=2", headers=admin_headers).json()
    assert body["total"] == 6 and len(body["items"]) == 2


def test_list_users_page_beyond_end_is_empty(client, admin_headers):
    _make_users(client, admin_headers, 2)
    body = client.get(f"{URL}?page=9", headers=admin_headers).json()
    assert body["items"] == [] and body["total"] == 3


@pytest.mark.parametrize("qs", ["page=0", "size=0", "size=101", "page=abc"])
def test_list_users_invalid_params_returns_422(client, admin_headers, qs):
    assert client.get(f"{URL}?{qs}", headers=admin_headers).status_code == 422


# Ticket 039: own profile


def test_get_my_profile_returns_authenticated_user(client, client_user):
    user, headers = client_user

    response = client.get(f"{URL}/me", headers=headers)

    assert response.status_code == 200

    data = response.json()
    assert data["id"] == user.id
    assert data["name"] == user.name
    assert data["email"] == user.email
    assert data["phone"] == user.phone
    assert data["role"] == user.role
    assert data["is_active"] is True


def test_get_my_profile_without_token_returns_401(client):
    response = client.get(f"{URL}/me")

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


def test_get_my_profile_with_invalid_token_returns_401(client):
    response = client.get(
        f"{URL}/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


def test_update_my_profile_success(client, db, client_user):
    user, headers = client_user

    response = client.put(
        f"{URL}/me",
        headers=headers,
        json={
            "name": "Updated Client",
            "phone": "+34600111222",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["id"] == user.id
    assert data["name"] == "Updated Client"
    assert data["phone"] == "+34600111222"
    assert data["email"] == user.email
    assert data["role"] == "client"
    assert data["is_active"] is True

    db.refresh(user)
    assert user.name == "Updated Client"
    assert user.phone == "+34600111222"


@pytest.mark.parametrize(
    ("forbidden_field", "forbidden_value"),
    [
        ("email", "attacker@example.com"),
        ("role", "admin"),
        ("is_active", False),
        ("auth_id", "another-auth-id"),
    ],
)
def test_update_my_profile_rejects_protected_fields(
    client,
    client_user,
    forbidden_field,
    forbidden_value,
):
    _, headers = client_user

    response = client.put(
        f"{URL}/me",
        headers=headers,
        json={
            "name": "Attempted Update",
            forbidden_field: forbidden_value,
        },
    )

    assert response.status_code == 422


def test_update_my_profile_without_token_returns_401(client):
    response = client.put(
        f"{URL}/me",
        json={
            "name": "Unauthorized Update",
            "phone": "+34600111222",
        },
    )

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"
