from collections import defaultdict
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.orm import Session, selectinload

from back.app.core.datetimes import as_utc
from back.app.core.errors import AppError
from back.app.core.pagination import PageParams, paginate
from back.app.models.booking import ACTIVE_STATUSES, Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import TimeSlotCreate, TimeSlotUpdate


def _get_slot_or_404(db: Session, slot_id: int) -> TimeSlot:
    slot = db.get(TimeSlot, slot_id)
    if slot is None:
        raise AppError(message="Time slot not found", code="NOT_FOUND", status_code=404)
    return slot


def _has_booking(db: Session, slot_id: int, *, only_active: bool) -> bool:
    stmt = select(Booking.id).where(Booking.time_slot_id == slot_id)
    if only_active:
        stmt = stmt.where(Booking.status.in_(ACTIVE_STATUSES))
    return db.execute(stmt).first() is not None


def _ensure_valid_range(starts_at: datetime, ends_at: datetime, *, check_past: bool):
    if check_past and starts_at < datetime.now(UTC):
        raise AppError(
            message="Start time cannot be in the past",
            code="VALIDATION_ERROR",
            status_code=422,
        )
    if ends_at <= starts_at:
        raise AppError(
            message="ends_at must be greater than starts_at",
            code="VALIDATION_ERROR",
            status_code=422,
        )


def _ensure_no_overlap(
    db: Session,
    room_id: int,
    starts_at: datetime,
    ends_at: datetime,
    *,
    ignore_id: int | None = None,
) -> None:
    stmt = select(TimeSlot.id).where(
        TimeSlot.room_id == room_id,
        TimeSlot.starts_at < ends_at,
        TimeSlot.ends_at > starts_at,
    )
    if ignore_id is not None:
        stmt = stmt.where(TimeSlot.id != ignore_id)
    if db.execute(stmt).first():
        raise AppError(
            message="Time slot overlaps with an existing slot",
            code="SLOT_OVERLAP",
            status_code=409,
        )


def list_time_slots(
    db: Session,
    params: PageParams,
    room_id: int | None,
    day: date | None,
    available: bool | None,
) -> dict:
    stmt = select(TimeSlot).options(selectinload(TimeSlot.bookings))
    if room_id is not None:
        stmt = stmt.where(TimeSlot.room_id == room_id)
    if day is not None:
        day_start = datetime(day.year, day.month, day.day, tzinfo=UTC)
        stmt = stmt.where(
            TimeSlot.starts_at >= day_start,
            TimeSlot.starts_at < day_start + timedelta(days=1),
        )
    if available is not None:
        has_active_booking = select(Booking.id).where(
            Booking.time_slot_id == TimeSlot.id,
            Booking.status.in_(ACTIVE_STATUSES),
        )
        bookable = and_(TimeSlot.status == "available", ~has_active_booking.exists())
        stmt = stmt.where(bookable if available else ~bookable)
    return paginate(db, stmt.order_by(TimeSlot.starts_at, TimeSlot.id), params)


def get_time_slot(db: Session, slot_id: int) -> TimeSlot:
    return _get_slot_or_404(db, slot_id)


def create_time_slot(db: Session, slot_in: TimeSlotCreate) -> TimeSlot:
    room = db.get(Room, slot_in.room_id)
    if not room:
        raise AppError(message="Room not found", code="NOT_FOUND", status_code=404)
    if room.status != "active":
        raise AppError(
            message="Room is inactive", code="ROOM_INACTIVE", status_code=409
        )

    starts_at = as_utc(slot_in.starts_at)
    ends_at = as_utc(slot_in.ends_at)
    _ensure_valid_range(starts_at, ends_at, check_past=True)
    _ensure_no_overlap(db, slot_in.room_id, starts_at, ends_at)

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


def update_time_slot(db: Session, slot_id: int, slot_in: TimeSlotUpdate) -> TimeSlot:
    db_slot = _get_slot_or_404(db, slot_id)

    room = db.get(Room, db_slot.room_id)
    if not room or room.status != "active":
        raise AppError(
            message="Room is inactive", code="ROOM_INACTIVE", status_code=409
        )

    if _has_booking(db, slot_id, only_active=True):
        raise AppError(
            message="Cannot edit time slot with an active booking",
            code="SLOT_TAKEN",
            status_code=409,
        )

    update_data = slot_in.model_dump(exclude_unset=True)
    new_starts = as_utc(update_data.get("starts_at", db_slot.starts_at))
    new_ends = as_utc(update_data.get("ends_at", db_slot.ends_at))

    _ensure_valid_range(new_starts, new_ends, check_past="starts_at" in update_data)
    if "starts_at" in update_data or "ends_at" in update_data:
        _ensure_no_overlap(db, db_slot.room_id, new_starts, new_ends, ignore_id=slot_id)

    if "starts_at" in update_data:
        db_slot.starts_at = new_starts
    if "ends_at" in update_data:
        db_slot.ends_at = new_ends
    if "status" in update_data:
        db_slot.status = update_data["status"]

    db.commit()
    db.refresh(db_slot)
    return db_slot


def delete_time_slot(db: Session, slot_id: int) -> None:
    db_slot = _get_slot_or_404(db, slot_id)

    if _has_booking(db, slot_id, only_active=False):
        raise AppError(
            message="Cannot delete a time slot that has bookings",
            code="SLOT_TAKEN",
            status_code=409,
        )

    db.delete(db_slot)
    db.commit()


def get_day_board(db: Session, day: date) -> dict:
    day_start = datetime(day.year, day.month, day.day, tzinfo=UTC)
    day_end = day_start + timedelta(days=1)

    rooms = (
        db.execute(
            select(Room)
            .options(
                selectinload(
                    Room.time_slots.and_(
                        TimeSlot.status == "available",
                        TimeSlot.starts_at > datetime.now(UTC),
                    )
                )
            )
            .where(Room.status == "active")
            .order_by(Room.name)
        )
        .scalars()
        .all()
    )

    slots = (
        db.execute(
            select(TimeSlot)
            .options(selectinload(TimeSlot.bookings))
            .where(
                and_(
                    TimeSlot.starts_at >= day_start,
                    TimeSlot.starts_at < day_end,
                )
            )
            .order_by(TimeSlot.starts_at)
        )
        .scalars()
        .all()
    )

    slots_by_room: dict[int, list[TimeSlot]] = defaultdict(list)
    for slot in slots:
        slots_by_room[slot.room_id].append(slot)

    return {
        "date": day,
        "rooms": [
            {"room": room, "slots": slots_by_room[room.id]}
            for room in rooms
            if slots_by_room[room.id]
        ],
    }
