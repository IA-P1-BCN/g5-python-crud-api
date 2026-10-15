import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClientConnectionError, PyJWTError
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.app.config.settings import settings
from back.app.core.errors import AppError
from back.app.core.security import decode_access_token
from back.app.database import SessionDep
from back.app.models import User

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)

email_adapter = TypeAdapter(EmailStr)

TRUSTED_PROVIDER = "google"


def unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _duplicate_email() -> AppError:
    return AppError(
        message="User with this email already exists",
        code="DUPLICATE",
        status_code=409,
    )


def _decode(token: str) -> dict:
    try:
        return decode_access_token(token)
    except PyJWKClientConnectionError:
        logger.error("auth keys unreachable")
        raise AppError(
            message="Authentication service unavailable",
            code="AUTH_UNAVAILABLE",
            status_code=503,
        ) from None
    except PyJWTError as exc:
        logger.warning("invalid token | reason=%s", type(exc).__name__)
        raise unauthorized("Invalid or expired token") from None


def _email_from(payload: dict) -> str:
    email_claim = payload.get("email")
    if not isinstance(email_claim, str) or not email_claim.strip():
        raise unauthorized("Token is missing a valid email")
    try:
        return str(email_adapter.validate_python(email_claim.strip())).lower()
    except ValidationError:
        raise unauthorized("Token is missing a valid email") from None


def _name_from(payload: dict) -> str:
    metadata = payload.get("user_metadata")
    if not isinstance(metadata, dict):
        metadata = {}
    name_claim = (
        metadata.get("full_name") or metadata.get("name") or payload.get("name")
    )
    if not isinstance(name_claim, str):
        raise unauthorized("Token is missing a valid name")
    name = name_claim.strip()
    if not name or len(name) > 100:
        raise unauthorized("Token is missing a valid name")
    return name


def _is_trusted_identity(payload: dict) -> bool:
    app_metadata = payload.get("app_metadata")
    return (
        isinstance(app_metadata, dict)
        and app_metadata.get("provider") == TRUSTED_PROVIDER
    )


def _admin_emails() -> set[str]:
    return {
        item.strip().lower()
        for item in settings.admin_emails.split(",")
        if item.strip()
    }


def _active_or_401(user: User) -> User:
    if not user.is_active:
        raise unauthorized("User is inactive")
    return user


def _first_login(db: Session, payload: dict, auth_id: str) -> User:
    email = _email_from(payload)
    name = _name_from(payload)
    trusted = _is_trusted_identity(payload)

    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing is not None:
        if not (trusted and existing.auth_id is None):
            raise _duplicate_email()
        existing.auth_id = auth_id
        user = existing
    else:
        role = "admin" if trusted and email in _admin_emails() else "client"
        user = User(auth_id=auth_id, name=name, email=email, role=role)
        db.add(user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        return _resolve_race(db, auth_id, email, exc)
    db.refresh(user)
    return _active_or_401(user)


def _resolve_race(db: Session, auth_id: str, email: str, exc: IntegrityError) -> User:
    concurrent = db.execute(
        select(User).where(User.auth_id == auth_id)
    ).scalar_one_or_none()
    if concurrent is not None:
        return _active_or_401(concurrent)

    if db.execute(select(User).where(User.email == email)).scalar_one_or_none():
        raise _duplicate_email()

    raise exc


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    db: SessionDep,
) -> User:
    if credentials is None:
        raise unauthorized("Not authenticated")

    payload = _decode(credentials.credentials)

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject.strip():
        raise unauthorized("Invalid token")
    auth_id = subject.strip()

    user = db.execute(select(User).where(User.auth_id == auth_id)).scalar_one_or_none()
    if user is not None:
        return _active_or_401(user)

    return _first_login(db, payload, auth_id)


def require_role(*roles: str):
    def checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise AppError(
                message="You do not have permission to do this",
                code="FORBIDDEN",
                status_code=403,
            )
        return user

    return checker
