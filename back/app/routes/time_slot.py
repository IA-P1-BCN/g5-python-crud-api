from datetime import date as date_type
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from back.app.controllers import time_slot as controller
from back.app.core.pagination import Page, PageParams
from back.app.core.responses import ADMIN_ERRORS
from back.app.database import SessionDep
from back.app.dependencies.auth import require_role
from back.app.schemas.time_slot import (
    PublicRoomBoardResponse,
    TimeSlotCreate,
    TimeSlotRead,
    TimeSlotResponse,
    TimeSlotUpdate,
)

router = APIRouter()

TimeSlotsResponse = Page[TimeSlotRead] | PublicRoomBoardResponse


@router.get(
    "",
    response_model=TimeSlotsResponse,
    summary="List time slots or the public day board",
    description="Paginated list of time slots (page default 1, size default 20, "
    "max 100), earliest first.",
    responses={
        200: {
            "description": (
                "Paginated time slots, or the public day board (not paginated) "
                "when only `date` is given (active rooms with their slots, BR-R6)."
            )
        },
        422: {"description": "Invalid filter, page or size"},
    },
)
def list_time_slots(
    db: SessionDep,
    params: Annotated[PageParams, Depends()],
    room_id: Annotated[int | None, Query(description="Filter by room")] = None,
    date: Annotated[date_type | None, Query(description="Filter by day (UTC)")] = None,
    available: Annotated[
        bool | None, Query(description="Only bookable slots (BR-S5)")
    ] = None,
):
    if room_id is None and available is None and date is not None:
        return controller.get_day_board(db, date)
    return controller.list_time_slots(db, params, room_id, date, available)


@router.get(
    "/{slot_id}",
    response_model=TimeSlotRead,
    summary="Get a time slot",
    responses={404: {"description": "Time slot not found."}},
)
def get_time_slot(slot_id: int, db: SessionDep):
    return controller.get_time_slot(db, slot_id)


@router.post(
    "",
    response_model=TimeSlotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a time slot",
    dependencies=[Depends(require_role("admin"))],
    responses={
        **ADMIN_ERRORS,
        404: {"description": "Room not found."},
        409: {"description": "ROOM_INACTIVE or SLOT_OVERLAP."},
        422: {"description": "Invalid body, past start or ends_at before starts_at."},
    },
)
def create_time_slot(slot_in: TimeSlotCreate, db: SessionDep):
    return controller.create_time_slot(db, slot_in)


@router.put(
    "/{slot_id}",
    response_model=TimeSlotResponse,
    summary="Update a time slot",
    description="Only the sent fields change; an explicit null is rejected.",
    dependencies=[Depends(require_role("admin"))],
    responses={
        **ADMIN_ERRORS,
        404: {"description": "Time slot not found."},
        409: {"description": "SLOT_TAKEN (active booking), ROOM_INACTIVE or SLOT_OVERLAP."},
        422: {"description": "Invalid body, null field, past start or bad range."},
    },
)
def update_time_slot(slot_id: int, slot_in: TimeSlotUpdate, db: SessionDep):
    return controller.update_time_slot(db, slot_id, slot_in)


@router.delete(
    "/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a time slot",
    dependencies=[Depends(require_role("admin"))],
    responses={
        **ADMIN_ERRORS,
        404: {"description": "Time slot not found."},
        409: {"description": "SLOT_TAKEN: the slot has bookings."},
    },
)
def delete_time_slot(slot_id: int, db: SessionDep):
    return controller.delete_time_slot(db, slot_id)
