from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from back.app.controllers import room as room_controller
from back.app.database import get_db
from back.app.schemas.room import RoomCreate, RoomResponse, RoomUpdate

router = APIRouter(prefix="", tags=["Rooms"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a room",
    responses={409: {"description": "Room name or slug already exists."}},
)
def create_room_endpoint(room_in: RoomCreate, db: SessionDep):
    return room_controller.create_room(db=db, room_in=room_in)


@router.put(
    "/{room_id}",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a room",
    responses={
        404: {"description": "Room not found."},
        409: {"description": "Room name or slug already exists."},
    },
)
def update_room_endpoint(room_id: int, room_in: RoomUpdate, db: SessionDep):
    return room_controller.update_room(db=db, room_id=room_id, room_in=room_in)


@router.put(
    "/{room_id}/deactivate",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate a room",
    responses={409: {"description": "Room has future active bookings."}},
)
def deactivate_room_endpoint(room_id: int, db: SessionDep):
    return room_controller.deactivate_room(db=db, room_id=room_id)


@router.get(
    "",
    response_model=list[RoomResponse],
    status_code=status.HTTP_200_OK,
    summary="List rooms",
)
def list_rooms_endpoint(db: SessionDep, status: str | None = None):
    return room_controller.list_rooms(db=db, status=status)


@router.get(
    "/{room_id_or_slug}",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a room by ID or slug",
    responses={404: {"description": "Room not found."}},
)
def get_room_endpoint(room_id_or_slug: str, db: SessionDep):
    return room_controller.get_room_by_id_or_slug(
        db=db,
        room_id_or_slug=room_id_or_slug,
    )


@router.put(
    "/{room_id}/activate",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate a room",
    responses={
        200: {
            "description": "Room successfully activated or already active (idempotent)."
        },
        404: {"description": "Room not found."},
    },
)
def activate_room_endpoint(room_id: int, db: SessionDep):
    return room_controller.activate_room(db=db, room_id=room_id)
