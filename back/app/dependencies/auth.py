from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from back.app.core.security import decode_access_token
from back.app.database import get_db
from back.app.models import User

bearer_scheme = HTTPBearer(auto_error=False)

SessionDep = Annotated[Session, Depends(get_db)]


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
        raise unauthorized("Invalid or expired token")

    subject = payload.get("sub")

    if not subject:
        raise unauthorized("Invalid token")

    user = db.execute(
        select(User).where(User.auth_id == str(subject))
    ).scalar_one_or_none()

    if user is None:
        raise unauthorized("User not found")

    if not user.is_active:
        raise unauthorized("User is inactive")

    return user
