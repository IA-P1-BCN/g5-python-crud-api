from sqlalchemy import select
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.core.pagination import PageParams, paginate
from back.app.models import User
from back.app.schemas.user import UserCreate, UserRoleUpdate, UserUpdate


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
        role="client",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise AppError(
            message="User not found",
            code="NOT_FOUND",
            status_code=404,
        )

    return user


def get_my_profile(current_user: User) -> User:
    return current_user


def list_users(db: Session, params: PageParams) -> dict:
    return paginate(db, select(User).order_by(User.id), params)


def update_user(db: Session, user_id: int, user_in: UserUpdate) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise AppError(
            message="User not found",
            code="NOT_FOUND",
            status_code=404,
        )

    user.name = user_in.name
    user.phone = user_in.phone

    db.commit()
    db.refresh(user)

    return user


def update_user_role(db: Session, user_id: int, role_in: UserRoleUpdate) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise AppError(
            message="User not found",
            code="NOT_FOUND",
            status_code=404,
        )

    user.role = role_in.role

    db.commit()
    db.refresh(user)

    return user


def deactivate_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise AppError(
            message="User not found",
            code="NOT_FOUND",
            status_code=404,
        )

    user.is_active = False

    db.commit()
    db.refresh(user)

    return user
