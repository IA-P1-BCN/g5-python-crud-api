from datetime import UTC, datetime
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from back.app.models.booking import Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import TimeSlotCreate, TimeSlotUpdate

ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "in_progress"]


def create_time_slot_controller(slot_in: TimeSlotCreate, db: Session) -> TimeSlot:
    room = db.get(Room, slot_in.room_id)
    if not room:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status != "active":
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Room is inactive")

    now = datetime.now(UTC)
    starts_at = slot_in.starts_at
    ends_at = slot_in.ends_at

    if starts_at < now:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Start time cannot be in the past")

    if ends_at <= starts_at:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="ends_at must be greater than starts_at")

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
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Time slot overlaps with an existing slot")

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
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Time slot not found")

    room = db.get(Room, db_slot.room_id)
    if not room or room.status != "active":
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Room is inactive")

    active_booking = db.execute(
        select(Booking).where(
            and_(
                Booking.time_slot_id == slot_id,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES)
            )
        )
    ).scalars().first()

    if active_booking:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Cannot edit time slot with an active booking")

    update_data = slot_in.model_dump(exclude_unset=True)

    new_starts = update_data.get("starts_at", db_slot.starts_at)
    new_ends = update_data.get("ends_at", db_slot.ends_at)
    now = datetime.now(UTC)

    if new_starts < now:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Start time cannot be in the past")

    if new_ends <= new_starts:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="ends_at must be greater than starts_at")

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
            from fastapi import HTTPException
            raise HTTPException(status_code=409, detail="Time slot overlaps with an existing slot")

    for field, value in update_data.items():
        setattr(db_slot, field, value)

    db.commit()
    db.refresh(db_slot)
    return db_slot


def delete_time_slot_controller(slot_id: int, db: Session) -> None:
    db_slot = db.get(TimeSlot, slot_id)
    if not db_slot:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Time slot not found")

    active_booking = db.execute(
        select(Booking).where(
            and_(
                Booking.time_slot_id == slot_id,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES)
            )
        )
    ).scalars().first()

    if active_booking:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Cannot delete time slot with an active booking")

    db.delete(db_slot)
    db.commit()