from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from back.app.controllers import time_slot as controller
from back.app.database import get_db
from back.app.schemas.time_slot import (
    TimeSlotCreate,
    TimeSlotResponse,
    TimeSlotUpdate,
)

router = APIRouter(prefix="/api/v1/time-slots", tags=["time-slots"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.post("/", response_model=TimeSlotResponse, status_code=status.HTTP_201_CREATED)
def create_time_slot(slot_in: TimeSlotCreate, db: SessionDep):
    return controller.create_time_slot_controller(slot_in, db)


@router.put("/{slot_id}", response_model=TimeSlotResponse)
def update_time_slot(slot_id: int, slot_in: TimeSlotUpdate, db: SessionDep):
    return controller.update_time_slot_controller(slot_id, slot_in, db)


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_slot(slot_id: int, db: SessionDep):
    return controller.delete_time_slot_controller(slot_id, db)