from datetime import UTC, datetime

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.models import Booking, Room, TimeSlot
from back.app.schemas.room import RoomUpdate

ACTIVE_STATUSES = ("PENDING", "CONFIRMED", "IN_PROGRESS")


def update_room(db: Session, room_id: int, room_in: RoomUpdate) -> Room:
    room = db.get(Room, room_id)
    if not room:
        raise AppError(
            message="Room not found",
            code="NOT_FOUND",
            status_code=404,
        )

    if room.name != room_in.name:
        stmt = select(Room).where(and_(Room.name == room_in.name, Room.id != room_id))
        existing_room = db.execute(stmt).scalar_one_or_none()
        if existing_room:
            raise AppError(
                message="Room with this name already exists",
                code="DUPLICATE",
                status_code=409,
            )

    for key, value in room_in.model_dump().items():
        setattr(room, key, value)

    db.commit()
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


def get_room_by_id(db: Session, room_id: int) -> Room:
    room = db.get(Room, room_id)
    if not room:
        raise AppError(
            message="Room not found",
            code="NOT_FOUND",
            status_code=404,
        )
    return room
