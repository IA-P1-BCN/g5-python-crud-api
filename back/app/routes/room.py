from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from back.app.database import get_db

from back.app.schemas.room import RoomCreate, RoomResponse
from back.app.controllers import room as room_controller

router = APIRouter()

@router.post("", response_model=RoomResponse, status_code=201)
def create_room_endpoint(
    room_in: RoomCreate,
    db: Session = Depends(get_db)
):
    return room_controller.create_room(db=db, room_in=room_in)