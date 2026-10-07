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
