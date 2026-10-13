import os
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Default configuration so the app does not fail when importing settings
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")

from back.app.config.settings import settings
from back.app.core import security
from back.app.database import Base, get_db
from back.app.main import app

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
    monkeypatch.setattr(settings, "supabase_url", "https://test.supabase.co")
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
    ):
        now = datetime.now(UTC)
        payload = {
            "aud": audience,
            "iss": issuer,
            "iat": now,
        }

        if include_subject:
            payload["sub"] = subject

        if include_exp:
            payload["exp"] = expires_at or now + timedelta(minutes=60)

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
    session = sessionmaker(bind=engine, expire_on_commit=False)()

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
