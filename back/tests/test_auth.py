from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from back.app.config.settings import settings
from back.app.dependencies.auth import get_current_user
from back.app.models import User

TEST_SUPABASE_JWT_SECRET = "test-supabase-jwt-secret-32-bytes!"


@pytest.fixture(autouse=True)
def use_test_supabase_secret(monkeypatch):
    monkeypatch.setattr(
        settings,
        "supabase_jwt_secret",
        TEST_SUPABASE_JWT_SECRET,
    )


def make_credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token,
    )


def make_token(
    subject: str | None = "google-user-123",
    *,
    expires_at: datetime | None = None,
    audience: str | None = "authenticated",
) -> str:
    payload = {}

    if subject is not None:
        payload["sub"] = subject

    if expires_at is not None:
        payload["exp"] = expires_at
    else:
        payload["exp"] = datetime.now(UTC) + timedelta(minutes=60)

    if audience is not None:
        payload["aud"] = audience

    return jwt.encode(
        payload,
        TEST_SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )


def test_get_current_user_missing_token(db):
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=None, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_invalid_token(db):
    credentials = make_credentials("invalid-token")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_expired_token(db):
    token = make_token(
        expires_at=datetime.now(UTC) - timedelta(minutes=1),
    )
    credentials = make_credentials(token)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_missing_exp(db):
    token = jwt.encode(
        {
            "sub": "google-user-123",
            "aud": "authenticated",
        },
        TEST_SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )
    credentials = make_credentials(token)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_missing_sub(db):
    token = make_token(subject=None)
    credentials = make_credentials(token)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_invalid_audience(db):
    token = make_token(audience="wrong-audience")
    credentials = make_credentials(token)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_unknown_user(db):
    token = make_token("google-user-123")
    credentials = make_credentials(token)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_inactive_user(db):
    user = User(
        auth_id="google-user-123",
        name="Inactive User",
        email="inactive@example.com",
        role="client",
        is_active=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = make_token(user.auth_id)
    credentials = make_credentials(token)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_valid_token(db):
    user = User(
        auth_id="google-user-123",
        name="Test User",
        email="test@example.com",
        role="client",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = make_token(user.auth_id)
    credentials = make_credentials(token)

    current_user = get_current_user(credentials=credentials, db=db)

    assert current_user.id == user.id
    assert current_user.auth_id == "google-user-123"
    assert current_user.email == "test@example.com"
    assert current_user.is_active is True
