from sqlalchemy import select
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.models import User
from back.app.schemas.user import UserCreate


def create_user(db: Session, user_in: UserCreate) -> User:
    normalized_email = str(user_in.email).lower()

    existing_user = db.execute(
        select(User).where(User.email == normalized_email)
    ).scalar_one_or_none()

    if existing_user:
        raise AppError(
            message="User with this email already exists",
            code="DUPLICATE",
            status_code=409,
        )

    user = User(
        name=user_in.name,
        email=normalized_email,
        phone=user_in.phone,
        role=user_in.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
