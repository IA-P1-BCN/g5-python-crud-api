from datetime import UTC, datetime

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from back.app.controllers.booking import ACTIVE_STATUSES
from back.app.core.errors import AppError
from back.app.models.booking import Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import TimeSlotCreate, TimeSlotUpdate


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def create_time_slot_controller(slot_in: TimeSlotCreate, db: Session) -> TimeSlot:
    room = db.get(Room, slot_in.room_id)
    if not room:
        raise AppError(message="Room not found", code="ROOM_NOT_FOUND", status_code=404)
    if room.status != "active":
        raise AppError(message="Room is inactive", code="ROOM_INACTIVE", status_code=409)

    now = datetime.now(UTC)
    starts_at = _ensure_utc(slot_in.starts_at)
    ends_at = _ensure_utc(slot_in.ends_at)

    if starts_at < now:
        raise AppError(message="Start time cannot be in the past", code="INVALID_START_TIME", status_code=422)

    if ends_at <= starts_at:
        raise AppError(message="ends_at must be greater than starts_at", code="INVALID_TIME_RANGE", status_code=422)

    overlapping = db.execute(
        select(TimeSlot).where(
            and_(
                TimeSlot.room_id == slot_in.room_id,
                TimeSlot.starts_at < ends_at,
                TimeSlot.ends_at > starts_at,
            )
        )
    ).scalars().first()

    if overlapping:
        raise AppError(message="Time slot overlaps with an existing slot", code="SLOT_OVERLAP", status_code=409)

    db_slot = TimeSlot(
        room_id=slot_in.room_id,
        starts_at=starts_at,
        ends_at=ends_at,
        status=slot_in.status or "available",
    )
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot


def update_time_slot_controller(slot_id: int, slot_in: TimeSlotUpdate, db: Session) -> TimeSlot:
    db_slot = db.get(TimeSlot, slot_id)
    if not db_slot:
        raise AppError(message="Time slot not found", code="SLOT_NOT_FOUND", status_code=404)

    room = db.get(Room, db_slot.room_id)
    if not room or room.status != "active":
        raise AppError(message="Room is inactive", code="ROOM_INACTIVE", status_code=409)

    active_booking = db.execute(
        select(Booking).where(
            and_(
                Booking.time_slot_id == slot_id,
                Booking.status.in_(ACTIVE_STATUSES)
            )
        )
    ).scalars().first()

    if active_booking:
        raise AppError(message="Cannot edit time slot with an active booking", code="ACTIVE_BOOKING_EXISTS", status_code=409)

    update_data = {k: v for k, v in slot_in.model_dump(exclude_unset=True).items() if v is not None}

    now = datetime.now(UTC)
    
    # Aseguramos zona horaria UTC para las fechas actuales en BD
    current_starts = _ensure_utc(db_slot.starts_at)
    current_ends = _ensure_utc(db_slot.ends_at)

    new_starts = _ensure_utc(update_data["starts_at"]) if "starts_at" in update_data else current_starts
    new_ends = _ensure_utc(update_data["ends_at"]) if "ends_at" in update_data else current_ends

    # Validar pasado solo si se está modificando explícitamente starts_at
    if "starts_at" in update_data and new_starts < now:
        raise AppError(message="Start time cannot be in the past", code="INVALID_START_TIME", status_code=422)

    if new_ends <= new_starts:
        raise AppError(message="ends_at must be greater than starts_at", code="INVALID_TIME_RANGE", status_code=422)

    if "starts_at" in update_data or "ends_at" in update_data:
        overlapping = db.execute(
            select(TimeSlot).where(
                and_(
                    TimeSlot.room_id == db_slot.room_id,
                    TimeSlot.id != slot_id,
                    TimeSlot.starts_at < new_ends,
                    TimeSlot.ends_at > new_starts,
                )
            )
        ).scalars().first()

        if overlapping:
            raise AppError(message="Time slot overlaps with an existing slot", code="SLOT_OVERLAP", status_code=409)

    if "starts_at" in update_data:
        db_slot.starts_at = new_starts
    if "ends_at" in update_data:
        db_slot.ends_at = new_ends
    if "status" in update_data:
        db_slot.status = update_data["status"]

    db.commit()
    db.refresh(db_slot)
    return db_slot


def delete_time_slot_controller(slot_id: int, db: Session) -> None:
    db_slot = db.get(TimeSlot, slot_id)
    if not db_slot:
        raise AppError(message="Time slot not found", code="SLOT_NOT_FOUND", status_code=404)

    active_booking = db.execute(
        select(Booking).where(
            and_(
                Booking.time_slot_id == slot_id,
                Booking.status.in_(ACTIVE_STATUSES)
            )
        )
    ).scalars().first()

    if active_booking:
        raise AppError(message="Cannot delete time slot with an active booking", code="ACTIVE_BOOKING_EXISTS", status_code=409)

    db.delete(db_slot)
    db.commit()