from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from back.app.controllers import booking as booking_controller
from back.app.core.limits import IdPath, IdQuery
from back.app.core.pagination import Page, PageParams
from back.app.database import get_db
from back.app.dependencies.auth import get_current_user, require_role
from back.app.models import User
from back.app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingRead,
    BookingUpdate,
    GameResultCreate,
    GameResultInfo,
)

router = APIRouter()

AUTH_ERRORS = {
    401: {"description": "UNAUTHORIZED: missing or invalid token"},
    403: {"description": "FORBIDDEN: not your booking or role not allowed"},
}


@router.post(
    "",
    response_model=BookingRead,
    status_code=201,
    summary="Create a booking",
    description="Books a time slot for a user. The booking starts as PENDING "
    "and total_price is room.base_price x players.",
    responses={
        **AUTH_ERRORS,
        404: {"description": "SLOT_NOT_FOUND or USER_NOT_FOUND"},
        409: {
            "description": "USER_INACTIVE, ROOM_INACTIVE, "
            "SLOT_NOT_AVAILABLE or SLOT_TAKEN"
        },
        422: {"description": "Invalid body or INVALID_PLAYERS"},
    },
)
def create_booking_endpoint(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_controller.create_booking(
        db=db, booking_in=booking_in, current_user=current_user
    )


@router.get(
    "",
    response_model=Page[BookingDetail],
    summary="List bookings",
    description="Paginated list of bookings (page default 1, size default 20, "
    "max 100) with room, slot, user and can_modify. Filters: "
    "user_id, room_id, status, and date_from/date_to (inclusive days, on the "
    "slot start). Use date_from=today for Upcoming, date_to=yesterday for "
    "Past, status=CANCELLED for Cancelled.",
    responses={
        **AUTH_ERRORS,
        422: {"description": "Invalid status, date filter, page or size"},
    },
)
def list_bookings_endpoint(
    params: Annotated[PageParams, Depends()],
    user_id: IdQuery = None,
    room_id: IdQuery = None,
    status: Literal["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = booking_controller.resolve_user_filter(current_user, user_id)
    return booking_controller.list_bookings(
        db=db,
        params=params,
        user_id=user_id,
        room_id=room_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/today",
    response_model=list[BookingDetail],
    summary="Today's bookings (staff)",
    description="Bookings whose slot starts today (UTC), earliest first. "
    "Cancelled bookings are left out. Staff and admin only. Declared before "
    "/{booking_id} so 'today' is not read as an id.",
    responses={
        401: {"description": "Missing or invalid token"},
        403: {"description": "FORBIDDEN: role is not staff or admin"},
    },
    dependencies=[Depends(require_role("staff", "admin"))],
)
def today_bookings_endpoint(
    db: Session = Depends(get_db),
):
    return booking_controller.list_today_bookings(db=db)


@router.get(
    "/{booking_id}",
    response_model=BookingDetail,
    summary="Get a booking",
    description="Returns a booking with slot, room, user and can_modify.",
    responses={**AUTH_ERRORS, 404: {"description": "NOT_FOUND"}},
)
def get_booking_endpoint(
    booking_id: IdPath,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_controller.get_booking(
        db=db, booking_id=booking_id, current_user=current_user
    )


@router.put(
    "/{booking_id}",
    response_model=BookingRead,
    summary="Modify a booking",
    description="Changes the number of players and/or moves the booking to "
    "another time slot. total_price is recalculated. Only PENDING or "
    "CONFIRMED bookings, 24h or more before the current slot starts. The new "
    "slot must be bookable and 24h or more away; the old slot becomes free. "
    "Sending the current time_slot_id changes nothing.",
    responses={
        **AUTH_ERRORS,
        404: {"description": "NOT_FOUND or SLOT_NOT_FOUND"},
        409: {
            "description": "INVALID_TRANSITION, TOO_LATE_TO_MODIFY, "
            "ROOM_INACTIVE, SLOT_NOT_AVAILABLE or SLOT_TAKEN"
        },
        422: {"description": "Invalid body or INVALID_PLAYERS"},
    },
)
def update_booking_endpoint(
    booking_id: IdPath,
    booking_in: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_controller.update_booking(
        db=db,
        booking_id=booking_id,
        booking_in=booking_in,
        current_user=current_user,
    )


@router.put(
    "/{booking_id}/cancel",
    response_model=BookingRead,
    summary="Cancel a booking",
    description="Sets the booking to CANCELLED and frees the slot. Only PENDING "
    "or CONFIRMED bookings, and only 24h or more before the slot starts.",
    responses={
        **AUTH_ERRORS,
        404: {"description": "NOT_FOUND"},
        409: {"description": "INVALID_TRANSITION or TOO_LATE_TO_CANCEL"},
    },
)
def cancel_booking_endpoint(
    booking_id: IdPath,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_controller.cancel_booking(
        db=db, booking_id=booking_id, current_user=current_user
    )


@router.put(
    "/{booking_id}/confirm",
    response_model=BookingRead,
    summary="Confirm a booking",
    dependencies=[Depends(require_role("staff", "admin"))],
    description="Moves a PENDING booking to CONFIRMED.",
    responses={
        **AUTH_ERRORS,
        404: {"description": "NOT_FOUND"},
        409: {"description": "INVALID_TRANSITION (booking is not PENDING)"},
    },
)
def confirm_booking_endpoint(
    booking_id: IdPath,
    db: Session = Depends(get_db),
):
    return booking_controller.confirm_booking(db=db, booking_id=booking_id)


@router.put(
    "/{booking_id}/start",
    response_model=BookingRead,
    summary="Start a game (staff)",
    description="Moves a CONFIRMED booking to IN_PROGRESS. Only on the day of "
    "the booking (UTC). Staff and admin only.",
    responses={
        401: {"description": "Missing or invalid token"},
        403: {"description": "FORBIDDEN: role is not staff or admin"},
        404: {"description": "NOT_FOUND"},
        409: {
            "description": "INVALID_TRANSITION (not CONFIRMED, or not the "
            "booking's day)"
        },
    },
    dependencies=[Depends(require_role("staff", "admin"))],
)
def start_booking_endpoint(
    booking_id: IdPath,
    db: Session = Depends(get_db),
):
    return booking_controller.start_booking(db=db, booking_id=booking_id)


@router.put(
    "/{booking_id}/finish",
    response_model=BookingRead,
    summary="Finish a game (staff)",
    description="Moves an IN_PROGRESS booking to COMPLETED. Staff and admin only.",
    responses={
        401: {"description": "Missing or invalid token"},
        403: {"description": "FORBIDDEN: role is not staff or admin"},
        404: {"description": "NOT_FOUND"},
        409: {"description": "INVALID_TRANSITION (not IN_PROGRESS)"},
    },
    dependencies=[Depends(require_role("staff", "admin"))],
)
def finish_booking_endpoint(
    booking_id: IdPath,
    db: Session = Depends(get_db),
):
    return booking_controller.finish_booking(db=db, booking_id=booking_id)


@router.post(
    "/{booking_id}/result",
    response_model=GameResultInfo,
    status_code=201,
    summary="Register a game result (staff)",
    description="Registers completed and completion_time (seconds) once, only "
    "for a COMPLETED booking. Staff and admin only.",
    responses={
        401: {"description": "Missing or invalid token"},
        403: {"description": "FORBIDDEN: role is not staff or admin"},
        404: {"description": "NOT_FOUND"},
        409: {"description": "INVALID_TRANSITION (not COMPLETED) or DUPLICATE"},
        422: {"description": "Invalid body"},
    },
    dependencies=[Depends(require_role("staff", "admin"))],
)
def register_result_endpoint(
    booking_id: IdPath,
    result_in: GameResultCreate,
    db: Session = Depends(get_db),
):
    return booking_controller.register_result(
        db=db, booking_id=booking_id, result_in=result_in
    )
