from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from back.app.controllers import room as room_controller
from back.app.database import get_db
from back.app.schemas.room import RoomCreate, RoomResponse, RoomUpdate

router = APIRouter(prefix="", tags=["Rooms"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room_endpoint(
    room_in: RoomCreate,
    db: SessionDep
):
    return room_controller.create_room(db=db, room_in=room_in)


@router.put("/{room_id}", response_model=RoomResponse, status_code=status.HTTP_200_OK)
def update_room_endpoint(
    room_id: int,
    room_in: RoomUpdate,
    db: SessionDep
):
    return room_controller.update_room(db=db, room_id=room_id, room_in=room_in)

@router.put("/{room_id}/deactivate", response_model=RoomResponse, status_code=status.HTTP_200_OK)
def deactivate_room_endpoint(
    room_id: int,
    db: SessionDep
):
    return room_controller.deactivate_room(db=db, room_id=room_id)