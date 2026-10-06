from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.models import Booking, TimeSlot, User
from back.app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingRead,
    BookingUpdate,
)

ACTIVE_STATUSES = ("PENDING", "CONFIRMED", "IN_PROGRESS")
MODIFIABLE_STATUSES = ("PENDING", "CONFIRMED")
MIN_NOTICE = timedelta(hours=24)


def create_booking(db: Session, booking_in: BookingCreate) -> Booking:
    slot = db.get(TimeSlot, booking_in.time_slot_id)
    if slot is None:
        raise AppError("Time slot not found", code="SLOT_NOT_FOUND", status_code=404)

    user = db.get(User, booking_in.user_id)
    if user is None:
        raise AppError("User not found", code="USER_NOT_FOUND", status_code=404)

    if not user.is_active:
        raise AppError("User is inactive", code="USER_INACTIVE", status_code=409)

    if slot.room.status != "active":
        raise AppError("Room is inactive", code="ROOM_INACTIVE", status_code=409)

    if slot.status != "available":
        raise AppError(
            "Time slot is not available", code="SLOT_NOT_AVAILABLE", status_code=409
        )

    already_booked = db.execute(
        select(Booking.id).where(
            Booking.time_slot_id == slot.id,
            Booking.status.in_(ACTIVE_STATUSES),
        )
    ).first()
    if already_booked:
        raise AppError(
            "Time slot is already booked", code="SLOT_TAKEN", status_code=409
        )

    if booking_in.players > slot.room.capacity:
        raise AppError(
            f"Players exceed room capacity ({slot.room.capacity})",
            code="INVALID_PLAYERS",
            status_code=422,
        )

    booking = Booking(
        user_id=user.id,
        time_slot_id=slot.id,
        players=booking_in.players,
        total_price=slot.room.base_price * booking_in.players,
        status="PENDING",
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(
            "Time slot is already booked", code="SLOT_TAKEN", status_code=409
        )
    db.refresh(booking)
    return booking


def list_bookings(
    db: Session, user_id: int | None = None, status: str | None = None
) -> list[Booking]:
    stmt = select(Booking).order_by(Booking.id)
    if user_id is not None:
        stmt = stmt.where(Booking.user_id == user_id)
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    return list(db.scalars(stmt))


def get_booking(db: Session, booking_id: int) -> BookingDetail:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise AppError("Booking not found", code="NOT_FOUND", status_code=404)

    return BookingDetail(
        **BookingRead.model_validate(booking).model_dump(),
        time_slot=booking.time_slot,
        room=booking.time_slot.room,
    )


def update_booking(db: Session, booking_id: int, booking_in: BookingUpdate) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise AppError("Booking not found", code="NOT_FOUND", status_code=404)

    if booking.status not in MODIFIABLE_STATUSES:
        raise AppError(
            f"Cannot modify a {booking.status} booking",
            code="INVALID_TRANSITION",
            status_code=409,
        )

    starts_at = booking.time_slot.starts_at
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=UTC)
    if starts_at - datetime.now(UTC) < MIN_NOTICE:
        raise AppError(
            "Bookings can only be modified 24h or more before the slot starts",
            code="TOO_LATE_TO_MODIFY",
            status_code=409,
        )

    room = booking.time_slot.room
    if booking_in.players > room.capacity:
        raise AppError(
            f"Players exceed room capacity ({room.capacity})",
            code="INVALID_PLAYERS",
            status_code=422,
        )

    booking.players = booking_in.players
    booking.total_price = room.base_price * booking_in.players
    db.commit()
    db.refresh(booking)
    return booking
