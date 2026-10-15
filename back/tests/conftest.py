import os
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Default configuration so the app does not fail when importing settings.
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")

from back.app.config.settings import settings
from back.app.core import security
from back.app.database import Base, get_db
from back.app.main import app
from back.app.models import User

TEST_KID = "test-ec-key"
TEST_ISSUER = "https://test.supabase.co/auth/v1"
TEST_PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
TEST_HS256_SECRET = "test-only-hs256-secret-at-least-32-bytes"


class FakeSigningKey:
    def __init__(self, key):
        self.key = key


class FakeJWKClient:
    def get_signing_key_from_jwt(self, token):
        header = jwt.get_unverified_header(token)

        if header.get("kid") != TEST_KID:
            raise jwt.PyJWKClientError("Unknown key ID")

        return FakeSigningKey(TEST_PRIVATE_KEY.public_key())


@pytest.fixture(autouse=True)
def configure_test_jwks(monkeypatch):
    monkeypatch.setattr(
        settings,
        "supabase_url",
        "https://test.supabase.co",
    )
    monkeypatch.setattr(security, "SUPABASE_ISSUER", TEST_ISSUER)
    monkeypatch.setattr(
        security,
        "SUPABASE_JWKS_URL",
        f"{TEST_ISSUER}/.well-known/jwks.json",
    )
    monkeypatch.setattr(security, "jwks_client", FakeJWKClient())


@pytest.fixture
def make_token():
    def _make_token(
        subject="google-user-123",
        *,
        expires_at=None,
        audience="authenticated",
        issuer=TEST_ISSUER,
        kid=TEST_KID,
        private_key=TEST_PRIVATE_KEY,
        algorithm="ES256",
        include_exp=True,
        include_subject=True,
        email="new-user@example.com",
        include_email=True,
        user_metadata=None,
        include_user_metadata=True,
        name=None,
        provider="google",
    ):
        now = datetime.now(UTC)

        payload = {
            "aud": audience,
            "iss": issuer,
            "iat": now,
            "app_metadata": {"provider": provider},
        }

        if include_subject:
            payload["sub"] = subject

        if include_exp:
            payload["exp"] = expires_at or now + timedelta(minutes=60)

        if include_email:
            payload["email"] = email

        if include_user_metadata:
            if user_metadata is None:
                user_metadata = {"full_name": "New User"}

            payload["user_metadata"] = user_metadata

        if name is not None:
            payload["name"] = name

        signing_key = private_key

        if algorithm == "HS256":
            signing_key = TEST_HS256_SECRET

        return jwt.encode(
            payload,
            signing_key,
            algorithm=algorithm,
            headers={"kid": kid},
        )

    return _make_token


@pytest.fixture
def db():
    """In-memory SQLite database, brand new and isolated for each test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(
        bind=engine,
        expire_on_commit=False,
    )()

    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def client(db):
    """FastAPI HTTP client that points the database to the test environment."""

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def admin_headers(db, make_token):
    """Create an admin user and return valid authentication headers."""
    admin = User(
        auth_id="test-admin-sub",
        name="Test Admin",
        email="admin@example.com",
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()

    token = make_token(
        subject=admin.auth_id,
        email=admin.email,
    )

    return {"Authorization": f"Bearer {token}"}


def _headers_for(db, make_token, auth_id, name, email, role):
    user = User(auth_id=auth_id, name=name, email=email, role=role, is_active=True)
    db.add(user)
    db.commit()
    return user, {"Authorization": f"Bearer {make_token(subject=auth_id, email=email)}"}


@pytest.fixture
def staff_headers(db, make_token):
    """Create a staff user and return valid authentication headers."""
    return _headers_for(
        db, make_token, "test-staff-sub", "Test Staff", "staff@example.com", "staff"
    )[1]


@pytest.fixture
def client_user(db, make_token):
    """A regular client user plus its headers: (user, headers)."""
    return _headers_for(
        db, make_token, "test-client-sub", "Test Client", "client@example.com", "client"
    )


@pytest.fixture
def client_headers(client_user):
    return client_user[1]
