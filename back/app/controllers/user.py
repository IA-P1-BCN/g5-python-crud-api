from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.core.integrity import is_violation_of
from back.app.core.pagination import PageParams, paginate
from back.app.models import User
from back.app.schemas.user import UserCreate, UserRoleUpdate, UserUpdate

EMAIL_MARKERS = ("users_email_key", "users.email", "ix_users_email", "uq_users_email")


def _duplicate_email() -> AppError:
    return AppError(
        message="User with this email already exists",
        code="DUPLICATE",
        status_code=409,
    )


def _ensure_not_last_admin(db: Session, user: User) -> None:
    if user.role != "admin" or not user.is_active:
        return
    other_admins = db.scalar(
        select(func.count())
        .select_from(User)
        .where(User.role == "admin", User.is_active, User.id != user.id)
    )
    if not other_admins:
        raise AppError(
            message="Cannot remove the last active admin",
            code="LAST_ADMIN",
            status_code=409,
        )


def create_user(db: Session, user_in: UserCreate) -> User:
    normalized_email = str(user_in.email).lower()

    existing_user = db.execute(
        select(User).where(User.email == normalized_email)
    ).scalar_one_or_none()

    if existing_user:
        raise _duplicate_email()

    user = User(
        name=user_in.name,
        email=normalized_email,
        phone=user_in.phone,
        role="client",
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if not is_violation_of(exc, *EMAIL_MARKERS):
            raise
        raise _duplicate_email() from exc
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
    if "phone" in user_in.model_fields_set:
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

    if role_in.role != "admin":
        _ensure_not_last_admin(db, user)
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

    _ensure_not_last_admin(db, user)
    user.is_active = False

    db.commit()
    db.refresh(user)

    return user
