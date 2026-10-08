from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from back.app.config.settings import settings
from back.app.core.security import create_access_token
from back.app.dependencies.auth import get_current_user
from back.app.models import User


def make_credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token,
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
    payload = {
        "sub": "google-user-123",
        "exp": datetime.now(UTC) - timedelta(minutes=1),
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    credentials = make_credentials(token)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_missing_sub(db):
    payload = {
        "exp": datetime.now(UTC) + timedelta(minutes=60),
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    credentials = make_credentials(token)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=credentials, db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_unknown_user(db):
    token = create_access_token("google-user-123")
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

    token = create_access_token(user.auth_id)
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

    token = create_access_token(user.auth_id)
    credentials = make_credentials(token)

    current_user = get_current_user(credentials=credentials, db=db)

    assert current_user.id == user.id
    assert current_user.auth_id == "google-user-123"
    assert current_user.email == "test@example.com"
    assert current_user.is_active is True
