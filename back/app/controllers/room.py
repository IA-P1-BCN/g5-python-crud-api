from sqlalchemy import select
from sqlalchemy.orm import Session

from back.app.models.room import Room
from back.app.schemas.room import RoomCreate
from back.app.core.errors import AppError


def create_room(db: Session, room_in: RoomCreate) -> Room:
    stmt = select(Room).where(Room.name == room_in.name)
    existing_room = db.execute(stmt).scalar_one_or_none()

    if existing_room:
        raise AppError(
            message="Room with this name already exists",
            code="DUPLICATE",
            status_code=409
        )

    db_room = Room(**room_in.model_dump())

    db.add(db_room)
    db.commit()
    db.refresh(db_room)

    return db_room