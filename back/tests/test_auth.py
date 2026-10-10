from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select

from back.app.core.errors import AppError
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


def test_get_current_user_first_login_creates_client(make_token, db):
    token = make_token(
        subject="google-user-123",
        email="New.User@example.com",
        user_metadata={"full_name": "New User"},
    )

    current_user = get_current_user(
        credentials=make_credentials(token),
        db=db,
    )

    assert current_user.id is not None
    assert current_user.auth_id == "google-user-123"
    assert current_user.name == "New User"
    assert current_user.email == "new.user@example.com"
    assert current_user.role == "client"
    assert current_user.is_active is True

    users = db.scalars(select(User)).all()
    assert len(users) == 1


def test_get_current_user_existing_user(make_token, db):
    user = User(
        auth_id="google-user-123",
        name="Existing User",
        email="existing@example.com",
        role="client",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = make_token(
        subject="google-user-123",
        email="different@example.com",
    )

    current_user = get_current_user(
        credentials=make_credentials(token),
        db=db,
    )

    assert current_user.id == user.id
    assert current_user.email == "existing@example.com"
    assert db.query(User).count() == 1


def test_get_current_user_unknown_user_without_email(make_token, db):
    token = make_token(include_email=False)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401
    assert db.query(User).count() == 0


def test_get_current_user_unknown_user_without_name(make_token, db):
    token = make_token(
        include_user_metadata=False,
        name=None,
    )

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401
    assert db.query(User).count() == 0


def test_get_current_user_duplicate_email_does_not_link(
    make_token,
    db,
):
    existing_user = User(
        auth_id=None,
        name="Existing User",
        email="new-user@example.com",
        role="client",
        is_active=True,
    )
    db.add(existing_user)
    db.commit()

    token = make_token(
        subject="different-google-user",
        email="new-user@example.com",
    )

    with pytest.raises(AppError) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 409

    db.refresh(existing_user)
    assert existing_user.auth_id is None
    assert db.query(User).count() == 1


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


def test_get_current_user_recovers_from_concurrent_first_login(
    make_token,
    db,
    monkeypatch,
):
    from sqlalchemy.exc import IntegrityError

    token = make_token(
        subject="google-user-123",
        email="new-user@example.com",
        user_metadata={"full_name": "First Request"},
    )

    # Simulate another request winning the insert race.
    original_commit = db.commit

    def commit_with_concurrent_insert():
        db.rollback()

        concurrent_user = User(
            auth_id="google-user-123",
            name="Concurrent User",
            email="new-user@example.com",
            role="client",
            is_active=True,
        )
        db.add(concurrent_user)
        original_commit()

        # The competing request has committed the user.
        # Simulate the unique-constraint error of our insert.
        raise IntegrityError(
            "INSERT INTO users",
            {},
            Exception("unique constraint violation"),
        )

    monkeypatch.setattr(db, "commit", commit_with_concurrent_insert)

    current_user = get_current_user(
        credentials=make_credentials(token),
        db=db,
    )

    assert current_user.auth_id == "google-user-123"
    assert current_user.name == "Concurrent User"
    assert current_user.email == "new-user@example.com"
    assert current_user.role == "client"
    assert db.query(User).count() == 1


def test_get_current_user_rejects_invalid_email(make_token, db):
    token = make_token(
        email="not-an-email",
        user_metadata={"full_name": "Invalid Email User"},
    )

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401
    assert db.query(User).count() == 0


def test_get_current_user_rejects_name_over_100_characters(
    make_token,
    db,
):
    token = make_token(
        user_metadata={"full_name": "A" * 101},
    )

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=make_credentials(token), db=db)

    assert exc_info.value.status_code == 401
    assert db.query(User).count() == 0


def test_get_current_user_prefers_full_name(make_token, db):
    token = make_token(
        user_metadata={
            "full_name": "Full Name",
            "name": "Metadata Name",
        },
        name="Top Level Name",
    )

    current_user = get_current_user(
        credentials=make_credentials(token),
        db=db,
    )

    assert current_user.name == "Full Name"


def test_get_current_user_falls_back_to_metadata_name(make_token, db):
    token = make_token(
        user_metadata={"name": "Metadata Name"},
        name="Top Level Name",
    )

    current_user = get_current_user(
        credentials=make_credentials(token),
        db=db,
    )

    assert current_user.name == "Metadata Name"


def test_get_current_user_falls_back_to_top_level_name(make_token, db):
    token = make_token(
        include_user_metadata=False,
        name="Top Level Name",
    )

    current_user = get_current_user(
        credentials=make_credentials(token),
        db=db,
    )

    assert current_user.name == "Top Level Name"


def test_get_current_user_strips_spaces_from_subject(make_token, db):
    token = make_token(
        subject="  google-user-123  ",
        email="spaced-sub@example.com",
        user_metadata={"full_name": "Spaced Subject"},
    )

    current_user = get_current_user(
        credentials=make_credentials(token),
        db=db,
    )

    assert current_user.auth_id == "google-user-123"
    assert current_user.email == "spaced-sub@example.com"
