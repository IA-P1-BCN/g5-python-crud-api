from datetime import UTC, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from back.app.core.datetimes import as_utc
from back.app.core.errors import AppError
from back.app.core.integrity import is_violation_of
from back.app.core.pagination import PageParams, paginate
from back.app.models import Booking, Room, TimeSlot
from back.app.models.booking import ACTIVE_STATUSES
from back.app.models.room import generate_slug
from back.app.schemas.room import (
    RoomCreate,
    RoomUpdate,
    TimeSlotBulkGenerateRequest,
    TimeSlotBulkGenerateResponse,
)

DUPLICATE_MARKERS = ("uq_rooms_slug", "rooms_name_key", "rooms.slug", "rooms.name")

SLOT_RESET_BUFFER_MINUTES = 30

MAX_BULK_GENERATE_DAYS = 90


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
        if not is_violation_of(exc, *DUPLICATE_MARKERS):
            raise
        raise AppError(
            message="Room with this name or slug already exists",
            code="DUPLICATE",
            status_code=409,
        ) from exc
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
        if not is_violation_of(exc, *DUPLICATE_MARKERS):
            raise
        raise AppError(
            message="Room with this name already exists",
            code="DUPLICATE",
            status_code=409,
        ) from exc
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
            code="ROOM_HAS_BOOKINGS",
            status_code=409,
        )

    room.status = "inactive"

    db.commit()
    db.refresh(room)

    return room


def list_rooms(db: Session, params: PageParams, status: str | None = None) -> dict:
    upcoming_slots = selectinload(
        Room.time_slots.and_(
            TimeSlot.status == "available", TimeSlot.starts_at > datetime.now(UTC)
        )
    )
    stmt = select(Room).options(upcoming_slots).order_by(Room.id)
    if status:
        stmt = stmt.where(Room.status == status)
    return paginate(db, stmt, params)


def get_room_by_id_or_slug(db: Session, room_id_or_slug: str) -> Room:
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
    if room.status == "active":
        return room

    room.status = "active"
    db.commit()
    db.refresh(room)

    return room


def bulk_generate_time_slots(
    db: Session, room_id: int, payload: TimeSlotBulkGenerateRequest
) -> TimeSlotBulkGenerateResponse:
    room = db.get(Room, room_id)
    if not room:
        raise AppError(
            message="Room not found",
            code="NOT_FOUND",
            status_code=404,
        )
    if room.status != "active":
        raise AppError(
            message="Room is inactive",
            code="ROOM_INACTIVE",
            status_code=409,
        )

    if payload.date_from > payload.date_to:
        raise AppError(
            message="date_from must not be after date_to",
            code="VALIDATION_ERROR",
            status_code=422,
        )
    if (payload.date_to - payload.date_from).days > MAX_BULK_GENERATE_DAYS:
        raise AppError(
            message=f"date range cannot exceed {MAX_BULK_GENERATE_DAYS} days",
            code="VALIDATION_ERROR",
            status_code=422,
        )
    if payload.first_start > payload.last_start:
        raise AppError(
            message="first_start must not be later than last_start",
            code="VALIDATION_ERROR",
            status_code=422,
        )

    duration_minutes = room.duration
    step = timedelta(minutes=duration_minutes + SLOT_RESET_BUFFER_MINUTES)

    now = datetime.now(UTC)

    range_start = datetime.combine(payload.date_from, time.min, tzinfo=UTC)
    range_end = datetime.combine(
        payload.date_to + timedelta(days=1), time.min, tzinfo=UTC
    )

    existing_rows = db.execute(
        select(TimeSlot.starts_at, TimeSlot.ends_at).where(
            TimeSlot.room_id == room_id,
            TimeSlot.starts_at < range_end,
            TimeSlot.ends_at > range_start,
        )
    ).all()
    existing = [(as_utc(start), as_utc(end)) for start, end in existing_rows]

    created_count = 0
    skipped_count = 0

    current_date = payload.date_from
    while current_date <= payload.date_to:
        slot_start_dt = datetime.combine(current_date, payload.first_start, tzinfo=UTC)
        last_start_dt = datetime.combine(current_date, payload.last_start, tzinfo=UTC)

        while slot_start_dt <= last_start_dt:
            slot_end_dt = slot_start_dt + timedelta(minutes=duration_minutes)

            if slot_start_dt < now or any(
                start < slot_end_dt and end > slot_start_dt for start, end in existing
            ):
                skipped_count += 1
            else:
                db.add(
                    TimeSlot(
                        room_id=room_id,
                        starts_at=slot_start_dt,
                        ends_at=slot_end_dt,
                        status="available",
                    )
                )
                existing.append((slot_start_dt, slot_end_dt))
                created_count += 1

            slot_start_dt += step

        current_date += timedelta(days=1)

    db.commit()

    return TimeSlotBulkGenerateResponse(
        created_count=created_count,
        skipped_count=skipped_count,
    )
