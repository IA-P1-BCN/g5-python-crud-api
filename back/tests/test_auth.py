from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

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


def test_get_current_user_expired_token(make_token, db):
    token = make_token(
        expires_at=datetime.now(UTC) - timedelta(minutes=1),
    )

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_missing_exp(make_token, db):
    token = make_token(include_exp=False)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_missing_sub(make_token, db):
    token = make_token(include_subject=False)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_invalid_audience(make_token, db):
    token = make_token(audience="wrong-audience")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_invalid_issuer(make_token, db):
    token = make_token(issuer="https://attacker.example/auth/v1")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_unknown_user(make_token, db):
    token = make_token("google-user-123")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_inactive_user(make_token, db):
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

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_valid_token(make_token, db):
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
    current_user = get_current_user(
        credentials=make_credentials(token),
        db=db,
    )

    assert current_user.id == user.id
    assert current_user.auth_id == "google-user-123"
    assert current_user.email == "test@example.com"
    assert current_user.is_active is True


def test_get_current_user_rejects_unknown_kid(make_token, db):
    token = make_token(kid="unknown-key-id")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_wrong_signature(make_token, db):
    from cryptography.hazmat.primitives.asymmetric import ec

    wrong_private_key = ec.generate_private_key(ec.SECP256R1())
    token = make_token(private_key=wrong_private_key)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_hs256(make_token, db):
    token = make_token(algorithm="HS256")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401
