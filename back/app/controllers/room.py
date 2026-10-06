from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.models.room import Room
from back.app.schemas.room import RoomUpdate


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