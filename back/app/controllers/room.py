from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.models import Booking, Room, TimeSlot
from back.app.models.room import generate_slug
from back.app.schemas.room import RoomCreate, RoomUpdate

ACTIVE_STATUSES = ("PENDING", "CONFIRMED", "IN_PROGRESS")

DUPLICATE_CONSTRAINTS = ("uq_rooms_slug", "rooms_name_key")


def _is_unique_violation(exc: IntegrityError) -> bool:
    """Return True only for name/slug unique-constraint failures."""
    diag = getattr(exc.orig, "diag", None)
    constraint_name = getattr(diag, "constraint_name", None)
    message = str(exc.orig)
    return (
        constraint_name in DUPLICATE_CONSTRAINTS
        or "rooms.slug" in message
        or "rooms.name" in message
    )


def _ensure_name_is_available(
    db: Session, name: str, room_id: int | None = None
) -> None:
    stmt = select(Room.id).where(Room.name == name)
    if room_id is not None:
        stmt = stmt.where(Room.id != room_id)
    if db.execute(stmt).first():
        raise AppError(
            message="Room with this name already exists",
            code="DUPLICATE",
            status_code=409,
        )


def _ensure_slug_is_available(
    db: Session, slug: str, room_id: int | None = None
) -> None:
    stmt = select(Room.id).where(Room.slug == slug)
    if room_id is not None:
        stmt = stmt.where(Room.id != room_id)
    if db.execute(stmt).first():
        raise AppError(
            message="Room with this slug already exists",
            code="DUPLICATE",
            status_code=409,
        )


def create_room(db: Session, room_in: RoomCreate) -> Room:
    # BR-R7: validated here, like on update, so both return the same error shape.
    if room_in.min_players > room_in.capacity:
        raise AppError(
            message="BR-R7: min_players must be lower than or equal to capacity",
            code="VALIDATION_ERROR",
            status_code=422,
        )

    slug = room_in.slug or generate_slug(room_in.name)

    _ensure_name_is_available(db, room_in.name)
    _ensure_slug_is_available(db, slug)

    room = Room(
        name=room_in.name,
        capacity=room_in.capacity,
        duration=room_in.duration,
        base_price=room_in.base_price,
        slug=slug,
        genre=room_in.genre,
        min_players=room_in.min_players,
        difficulty=room_in.difficulty,
        hook=room_in.hook,
        story=room_in.story,
        audience=room_in.audience,
    )

    db.add(room)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if not _is_unique_violation(exc):
            raise
        raise AppError(
            message="Room with this name or slug already exists",
            code="DUPLICATE",
            status_code=409,
        )
    db.refresh(room)

    return room


def update_room(db: Session, room_id: int, room_in: RoomUpdate) -> Room:
    room = db.get(Room, room_id)
    if not room:
        raise AppError(
            message="Room not found",
            code="NOT_FOUND",
            status_code=404,
        )

    # Only apply fields the client actually sent (partial update). NULL values on
    # NOT NULL columns are rejected above, so none reach the ORM object.
    raw_updates = room_in.model_dump(exclude_unset=True)
    for field_name, value in raw_updates.items():
        if value is None:
            raise AppError(
                message=f"{field_name} cannot be null",
                code="VALIDATION_ERROR",
                status_code=422,
            )
    update_data = raw_updates

    if "name" in update_data and update_data["name"] != room.name:
        _ensure_name_is_available(db, update_data["name"], room_id=room_id)

    # BR-R7: validate against the effective room state (stored + supplied).
    effective_capacity = update_data.get("capacity", room.capacity)
    effective_min_players = update_data.get("min_players", room.min_players)
    if effective_min_players > effective_capacity:
        raise AppError(
            message="BR-R7: min_players must be lower than or equal to capacity",
            code="VALIDATION_ERROR",
            status_code=422,
        )

    for key, value in update_data.items():
        setattr(room, key, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if not _is_unique_violation(exc):
            raise
        raise AppError(
            message="Room with this name already exists",
            code="DUPLICATE",
            status_code=409,
        )
    db.refresh(room)

    return room


def deactivate_room(db: Session, room_id: int) -> Room:
    room = db.get(Room, room_id)
    if not room:
        raise AppError(
            message="Room not found",
            code="NOT_FOUND",
            status_code=404,
        )

    future_booking = db.execute(
        select(Booking.id)
        .join(TimeSlot, Booking.time_slot_id == TimeSlot.id)
        .where(
            TimeSlot.room_id == room_id,
            Booking.status.in_(ACTIVE_STATUSES),
            TimeSlot.starts_at > datetime.now(UTC),
        )
    ).first()

    if future_booking:
        raise AppError(
            message="Cannot deactivate room with future active bookings",
            code="CONFLICT",
            status_code=409,
        )

    room.status = "inactive"

    db.commit()
    db.refresh(room)

    return room


def list_rooms(db: Session, status: str | None = None) -> list[Room]:
    stmt = select(Room)
    if status:
        stmt = stmt.where(Room.status == status)
    return list(db.scalars(stmt).all())


def get_room_by_id_or_slug(db: Session, room_id_or_slug: str) -> Room:
    # isascii() rules out unicode digits ("²".isdigit() is True) and slugs always
    # contain at least one letter, so a pure number is an ID.
    if room_id_or_slug.isascii() and room_id_or_slug.isdigit():
        room = db.get(Room, int(room_id_or_slug))
    else:
        room = db.execute(
            select(Room).where(Room.slug == room_id_or_slug)
        ).scalar_one_or_none()

    if not room:
        raise AppError(
            message="Room not found",
            code="NOT_FOUND",
            status_code=404,
        )
    return room


def activate_room(db: Session, room_id: int) -> Room:
    room = db.get(Room, room_id)
    if not room:
        raise AppError(
            message="Room not found",
            code="NOT_FOUND",
            status_code=404,
        )
    # Idempotent: an already active room is returned unchanged
    if room.status == "active":
        return room

    room.status = "active"
    db.commit()
    db.refresh(room)

    return room
