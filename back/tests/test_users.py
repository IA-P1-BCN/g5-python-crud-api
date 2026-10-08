from back.app.models import User

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

    data = first_response.json()

    assert data["email"] == "alice@example.com"

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


def test_get_user_success(client):
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

    response = client.get(f"{URL}/{user_id}")

    assert response.status_code == 200
    assert response.json()["id"] == user_id
    assert response.json()["name"] == "Alice"
    assert response.json()["email"] == "alice@example.com"
    assert response.json()["phone"] == "+34123456789"


def test_get_user_not_found_returns_404(client):
    response = client.get(f"{URL}/999999")

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
