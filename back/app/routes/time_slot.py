from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from back.app.database import get_db
from back.app.models.booking import Booking
from back.app.models.room import Room
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import (
    TimeSlotCreate,
    TimeSlotResponse,
    TimeSlotUpdate,
)

router = APIRouter(prefix="/time-slots", tags=["time-slots"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.post("/", response_model=TimeSlotResponse, status_code=status.HTTP_201_CREATED)
def create_time_slot(slot_in: TimeSlotCreate, db: SessionDep):
    # 1. Validar que la habitación exista y esté activa (BR-R4)
    room = db.get(Room, slot_in.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status != "active":
        raise HTTPException(status_code=409, detail="Room is inactive")

    # 2. Validar que las fechas no estén en el pasado
    now = datetime.now(UTC)
    starts_at = slot_in.starts_at
    ends_at = slot_in.ends_at

    if starts_at < now:
        raise HTTPException(status_code=422, detail="Start time cannot be in the past")

    if ends_at <= starts_at:
        raise HTTPException(status_code=422, detail="ends_at must be greater than starts_at")

    # 3. Validar solapamiento con otros slots de la misma habitación
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
        raise HTTPException(status_code=409, detail="Time slot overlaps with an existing slot")

    # 4. Crear el time slot
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


@router.put("/{slot_id}", response_model=TimeSlotResponse)
def update_time_slot(slot_id: int, slot_in: TimeSlotUpdate, db: SessionDep):
    db_slot = db.get(TimeSlot, slot_id)
    if not db_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")

    # Validar si tiene reservas activas
    active_booking = db.execute(
        select(Booking).where(
            and_(
                Booking.time_slot_id == slot_id,
                Booking.status == "active"
            )
        )
    ).scalars().first()

    if active_booking:
        raise HTTPException(status_code=409, detail="Cannot edit time slot with an active booking")

    update_data = slot_in.model_dump(exclude_unset=True)

    new_starts = update_data.get("starts_at", db_slot.starts_at)
    new_ends = update_data.get("ends_at", db_slot.ends_at)

    if new_ends <= new_starts:
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
            raise HTTPException(status_code=409, detail="Time slot overlaps with an existing slot")

    for field, value in update_data.items():
        setattr(db_slot, field, value)

    db.commit()
    db.refresh(db_slot)
    return db_slot


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_slot(slot_id: int, db: SessionDep):
    db_slot = db.get(TimeSlot, slot_id)
    if not db_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")

    active_booking = db.execute(
        select(Booking).where(
            and_(
                Booking.time_slot_id == slot_id,
                Booking.status == "active"
            )
        )
    ).scalars().first()

    if active_booking:
        raise HTTPException(status_code=409, detail="Cannot delete time slot with an active booking")

    db.delete(db_slot)
    db.commit()
