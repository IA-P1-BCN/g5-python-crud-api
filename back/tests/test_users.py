from datetime import UTC, datetime, timedelta
from decimal import Decimal

from back.app.models import Booking, GameResult, Room, TimeSlot, User

URL = "/api/v1/users"


def test_create_user_success(client, db):
    response = client.post(
        URL,
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

    user = db.query(User).one()

    assert user.name == "Alice"
    assert user.email == "alice@example.com"
    assert user.phone == "+34123456789"
    assert user.role == "client"
    assert user.is_active is True


def test_create_user_duplicate_email_returns_409(client):
    first_response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        URL,
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


def test_create_user_email_is_normalized(client, db):
    first_response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "Alice@example.com",
        },
    )

    assert first_response.status_code == 201
    assert first_response.json()["email"] == "alice@example.com"

    user = db.query(User).one()
    assert user.email == "alice@example.com"

    second_response = client.post(
        URL,
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


def test_create_user_invalid_email_returns_422(client):
    response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "not-an-email",
        },
    )

    assert response.status_code == 422


def test_create_user_missing_name_returns_422(client):
    response = client.post(
        URL,
        json={
            "email": "alice@example.com",
        },
    )

    assert response.status_code == 422


def test_get_user_success(client, db, make_token):
    auth_id = "google-user-123"

    create_response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "phone": "+34123456789",
        },
    )

    assert create_response.status_code == 201

    user_id = create_response.json()["id"]
    user = db.get(User, user_id)

    assert user is not None

    user.auth_id = auth_id
    db.commit()

    token = make_token(auth_id)

    response = client.get(
        f"{URL}/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == user_id
    assert response.json()["name"] == "Alice"
    assert response.json()["email"] == "alice@example.com"
    assert response.json()["phone"] == "+34123456789"


def test_get_user_without_token_returns_401(client):
    create_response = client.post(
        URL,
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


def test_get_user_not_found_returns_404(client, db, make_token):
    auth_id = "google-user-123"

    user = User(
        auth_id=auth_id,
        name="Alice",
        email="alice@example.com",
        role="client",
        is_active=True,
    )
    db.add(user)
    db.commit()

    token = make_token(auth_id)

    response = client.get(
        f"{URL}/999999",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "User not found",
        "code": "NOT_FOUND",
    }


def test_update_user_success(client, db):
    create_response = client.post(
        URL,
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


def test_update_user_invalid_data_returns_422(client):
    create_response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    response = client.put(
        f"{URL}/{user_id}",
        json={
            "name": "",
            "phone": "+34987654321",
        },
    )

    assert response.status_code == 422


def test_update_user_rejects_email_change(client):
    create_response = client.post(
        URL,
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
        json={
            "name": "Alice Updated",
            "phone": "+34987654321",
            "email": "new@example.com",
        },
    )

    assert response.status_code == 422


def test_list_users_empty(client):
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == []


def test_list_users(client):
    first_response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    second_response = client.post(
        URL,
        json={
            "name": "Bob",
            "email": "bob@example.com",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get(URL)

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[0]["name"] == "Alice"
    assert data[0]["email"] == "alice@example.com"
    assert data[1]["name"] == "Bob"
    assert data[1]["email"] == "bob@example.com"


def test_list_users_is_ordered_by_id(client):
    first_response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    second_response = client.post(
        URL,
        json={
            "name": "Bob",
            "email": "bob@example.com",
        },
    )

    third_response = client.post(
        URL,
        json={
            "name": "Charlie",
            "email": "charlie@example.com",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert third_response.status_code == 201

    first_id = first_response.json()["id"]
    second_id = second_response.json()["id"]
    third_id = third_response.json()["id"]

    response = client.get(URL)

    assert response.status_code == 200

    data = response.json()

    assert [user["id"] for user in data] == [
        first_id,
        second_id,
        third_id,
    ]


def test_deactivate_user(client, db):
    create_response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    response = client.put(f"{URL}/{user_id}/deactivate")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == user_id
    assert data["is_active"] is False

    user = db.get(User, user_id)

    assert user is not None
    assert user.is_active is False


def test_deactivate_user_is_idempotent(client, db):
    create_response = client.post(
        URL,
        json={
            "name": "Alice",
            "email": "alice@example.com",
        },
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    first_response = client.put(f"{URL}/{user_id}/deactivate")
    second_response = client.put(f"{URL}/{user_id}/deactivate")

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert first_response.json()["is_active"] is False
    assert second_response.json()["is_active"] is False

    user = db.get(User, user_id)

    assert user is not None
    assert user.is_active is False


def test_deactivate_unknown_user_returns_404(client):
    response = client.put(f"{URL}/999999/deactivate")

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


def test_history_requires_authentication(client):
    assert client.get(f"{URL}/me/history").status_code == 401
