from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.core.security import decode_access_token
from back.app.database import get_db
from back.app.models import User

bearer_scheme = HTTPBearer(auto_error=False)

SessionDep = Annotated[Session, Depends(get_db)]

email_adapter = TypeAdapter(EmailStr)


def unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    db: SessionDep,
) -> User:
    if credentials is None:
        raise unauthorized("Not authenticated")

    try:
        payload = decode_access_token(credentials.credentials)
    except PyJWTError:
        raise unauthorized("Invalid or expired token") from None

    subject = payload.get("sub")

    if not isinstance(subject, str) or not subject.strip():
        raise unauthorized("Invalid token")

    auth_id = subject.strip()

    # First, look for a user already associated with this auth identity.
    user = db.execute(
        select(User).where(User.auth_id == auth_id)
    ).scalar_one_or_none()

    if user is not None:
        if not user.is_active:
            raise unauthorized("User is inactive")

        return user

    # A first login needs a valid email from the verified JWT.
    email_claim = payload.get("email")

    if not isinstance(email_claim, str) or not email_claim.strip():
        raise unauthorized("Token is missing a valid email")

    try:
        email = str(
            email_adapter.validate_python(email_claim.strip())
        ).lower()
    except ValidationError:
        raise unauthorized("Token is missing a valid email") from None

    # Prefer the Google/Supabase full_name metadata, then name metadata,
    # and finally the top-level name claim.
    metadata = payload.get("user_metadata")
    if not isinstance(metadata, dict):
        metadata = {}

    name_claim = (
        metadata.get("full_name")
        or metadata.get("name")
        or payload.get("name")
    )

    if not isinstance(name_claim, str):
        raise unauthorized("Token is missing a valid name")

    name = name_claim.strip()

    if not name or len(name) > 100:
        raise unauthorized("Token is missing a valid name")

    # Never associate an existing email with a different auth identity
    # automatically.
    existing_email_user = db.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()

    if existing_email_user is not None:
        raise AppError(
            message="User with this email already exists",
            code="DUPLICATE",
            status_code=409,
        )

    # New identities always receive the client role.
    user = User(
        auth_id=auth_id,
        name=name,
        email=email,
        role="client",
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user
