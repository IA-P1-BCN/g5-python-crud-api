from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from back.app.core.errors import AppError
from back.app.core.pagination import PageParams, paginate
from back.app.models import Booking, GameResult, TimeSlot, User
from back.app.models.booking import ACTIVE_STATUSES, ensure_transition
from back.app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingRead,
    BookingUpdate,
    GameResultCreate,
)

MODIFIABLE_STATUSES = ("PENDING", "CONFIRMED")
MIN_NOTICE = timedelta(hours=24)


def _utcnow() -> datetime:
    """Single source of 'now', so tests can freeze it (24h boundary)."""
    return datetime.now(UTC)


def _slot_start_utc(slot: TimeSlot) -> datetime:
    """Slot start as tz-aware UTC (SQLite returns naive datetimes)."""
    starts_at = slot.starts_at
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=UTC)
    return starts_at


def _starts_at_utc(booking: Booking) -> datetime:
    return _slot_start_utc(booking.time_slot)


def _get_booking_or_404(db: Session, booking_id: int) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise AppError("Booking not found", code="NOT_FOUND", status_code=404)
    return booking


def _to_detail(booking: Booking) -> BookingDetail:
    """Enriched view; can_modify uses the same rule as update/cancel."""
    can_modify = (
        booking.status in MODIFIABLE_STATUSES
        and _starts_at_utc(booking) - _utcnow() >= MIN_NOTICE
    )
    return BookingDetail(
        **BookingRead.model_validate(booking).model_dump(),
        time_slot=booking.time_slot,
        room=booking.time_slot.room,
        user=booking.user,
        result=booking.result,
        can_modify=can_modify,
    )


def _ensure_slot_can_receive_booking(db: Session, slot: TimeSlot) -> None:
    """BR-L5: the new slot must be bookable and 24h or more away."""
    if slot.room.status != "active":
        raise AppError("Room is inactive", code="ROOM_INACTIVE", status_code=409)

    if slot.status != "available":
        raise AppError(
            "Time slot is not available", code="SLOT_NOT_AVAILABLE", status_code=409
        )

    if _slot_start_utc(slot) - _utcnow() < MIN_NOTICE:
        raise AppError(
            "The new slot must start 24h or more from now",
            code="TOO_LATE_TO_MODIFY",
            status_code=409,
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


def _ensure_can_access(booking: Booking, user: User) -> None:
    """Clients only touch their own bookings; staff and admin touch any (US05)."""
    if user.role == "client" and booking.user_id != user.id:
        raise AppError(
            "You can only access your own bookings",
            code="FORBIDDEN",
            status_code=403,
        )


def resolve_user_filter(current_user: User, user_id: int | None) -> int | None:
    """Clients can only list their own bookings; others may filter freely."""
    if current_user.role != "client":
        return user_id
    if user_id not in (None, current_user.id):
        raise AppError(
            "You can only see your own bookings",
            code="FORBIDDEN",
            status_code=403,
        )
    return current_user.id


def create_booking(
    db: Session, booking_in: BookingCreate, current_user: User
) -> Booking:
    if current_user.role == "client" and booking_in.user_id != current_user.id:
        raise AppError(
            "You can only book for yourself", code="FORBIDDEN", status_code=403
        )
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


def _bookings_stmt(
    user_id: int | None = None,
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    room_id: int | None = None,
):
    """Filtered, ordered query shared by the list, today and history views."""
    if date_from is not None and date_to is not None and date_from > date_to:
        raise AppError(
            "date_from must not be after date_to",
            code="VALIDATION_ERROR",
            status_code=422,
        )
    stmt = (
        select(Booking)
        .join(TimeSlot)
        .options(
            joinedload(Booking.time_slot).joinedload(TimeSlot.room),
            joinedload(Booking.user),
            joinedload(Booking.result),
        )
        .order_by(Booking.id)
    )
    if user_id is not None:
        stmt = stmt.where(Booking.user_id == user_id)
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    if room_id is not None:
        stmt = stmt.where(TimeSlot.room_id == room_id)
    if date_from is not None:
        start = datetime(date_from.year, date_from.month, date_from.day, tzinfo=UTC)
        stmt = stmt.where(TimeSlot.starts_at >= start)
    if date_to is not None:
        end = datetime(date_to.year, date_to.month, date_to.day, tzinfo=UTC)
        stmt = stmt.where(TimeSlot.starts_at < end + timedelta(days=1))
    return stmt


def list_bookings(
    db: Session,
    params: PageParams,
    user_id: int | None = None,
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    room_id: int | None = None,
) -> dict:
    stmt = _bookings_stmt(user_id, status, date_from, date_to, room_id)
    page = paginate(db, stmt, params)
    page["items"] = [_to_detail(b) for b in page["items"]]
    return page


def list_today_bookings(db: Session) -> list[BookingDetail]:
    """Today's (UTC) games for the staff, earliest first, cancelled ones hidden."""
    today = _utcnow().date()
    stmt = (
        _bookings_stmt(date_from=today, date_to=today)
        .where(Booking.status != "CANCELLED")
        .order_by(None)
        .order_by(TimeSlot.starts_at, Booking.id)
    )
    return [_to_detail(b) for b in db.scalars(stmt)]


def get_booking(db: Session, booking_id: int, current_user: User) -> BookingDetail:
    booking = _get_booking_or_404(db, booking_id)
    _ensure_can_access(booking, current_user)
    return _to_detail(booking)


def update_booking(
    db: Session, booking_id: int, booking_in: BookingUpdate, current_user: User
) -> Booking:
    booking = _get_booking_or_404(db, booking_id)
    _ensure_can_access(booking, current_user)
    if booking.status not in MODIFIABLE_STATUSES:
        raise AppError(
            f"Cannot modify a {booking.status} booking",
            code="INVALID_TRANSITION",
            status_code=409,
        )

    if _starts_at_utc(booking) - _utcnow() < MIN_NOTICE:
        raise AppError(
            "Bookings can only be modified 24h or more before the slot starts",
            code="TOO_LATE_TO_MODIFY",
            status_code=409,
        )

    new_slot = booking.time_slot
    if (
        booking_in.time_slot_id is not None
        and booking_in.time_slot_id != booking.time_slot_id
    ):
        new_slot = db.get(TimeSlot, booking_in.time_slot_id)
        if new_slot is None:
            raise AppError(
                "Time slot not found", code="SLOT_NOT_FOUND", status_code=404
            )
        _ensure_slot_can_receive_booking(db, new_slot)

    room = new_slot.room
    players = booking_in.players if booking_in.players is not None else booking.players
    if players > room.capacity:
        raise AppError(
            f"Players exceed room capacity ({room.capacity})",
            code="INVALID_PLAYERS",
            status_code=422,
        )

    booking.time_slot = new_slot
    booking.players = players
    booking.total_price = room.base_price * players
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(
            "Time slot is already booked", code="SLOT_TAKEN", status_code=409
        )
    db.refresh(booking)
    return booking


def cancel_booking(db: Session, booking_id: int, current_user: User) -> Booking:
    booking = _get_booking_or_404(db, booking_id)
    _ensure_can_access(booking, current_user)
    ensure_transition(booking.status, "CANCELLED", "cancel")

    if _starts_at_utc(booking) - _utcnow() < MIN_NOTICE:
        raise AppError(
            "Bookings can only be cancelled 24h or more before the slot starts",
            code="TOO_LATE_TO_CANCEL",
            status_code=409,
        )

    booking.status = "CANCELLED"
    db.commit()
    db.refresh(booking)
    return booking


def confirm_booking(db: Session, booking_id: int) -> Booking:
    booking = _get_booking_or_404(db, booking_id)

    ensure_transition(booking.status, "CONFIRMED", "confirm")

    booking.status = "CONFIRMED"
    db.commit()
    db.refresh(booking)
    return booking


def start_booking(db: Session, booking_id: int) -> Booking:
    booking = _get_booking_or_404(db, booking_id)

    ensure_transition(booking.status, "IN_PROGRESS", "start")

    if _starts_at_utc(booking).date() != _utcnow().date():
        raise AppError(
            "A game can only start on the booking's date",
            code="INVALID_TRANSITION",
            status_code=409,
        )

    booking.status = "IN_PROGRESS"
    db.commit()
    db.refresh(booking)
    return booking


def finish_booking(db: Session, booking_id: int) -> Booking:
    booking = _get_booking_or_404(db, booking_id)

    ensure_transition(booking.status, "COMPLETED", "finish")

    booking.status = "COMPLETED"
    db.commit()
    db.refresh(booking)
    return booking


def register_result(
    db: Session, booking_id: int, result_in: GameResultCreate
) -> GameResult:
    booking = _get_booking_or_404(db, booking_id)

    if booking.status != "COMPLETED":
        raise AppError(
            f"Cannot register a result on a {booking.status} booking",
            code="INVALID_TRANSITION",
            status_code=409,
        )
    duplicate = AppError(
        "A result is already registered", code="DUPLICATE", status_code=409
    )
    if booking.result is not None:
        raise duplicate

    result = GameResult(booking_id=booking.id, **result_in.model_dump())
    db.add(result)
    try:
        db.commit()
    except IntegrityError:  # two requests at once: the unique index wins (BR-G4)
        db.rollback()
        raise duplicate from None
    db.refresh(booking)  # reload booking.result
    return result


def list_user_history(
    db: Session, user_id: int, current_user: User
) -> list[BookingDetail]:
    """Finished games of a user, most recent first (BR-G5)."""
    if current_user.id != user_id and current_user.role not in ("staff", "admin"):
        raise AppError(
            "You can only see your own history", code="FORBIDDEN", status_code=403
        )
    stmt = _bookings_stmt(user_id=user_id, status="COMPLETED")
    games = [_to_detail(b) for b in db.scalars(stmt)]
    return sorted(games, key=lambda b: b.time_slot.starts_at, reverse=True)
