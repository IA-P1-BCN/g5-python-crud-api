from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.app.database import Base

if TYPE_CHECKING:
    from back.app.models.booking import Booking
    from back.app.models.room import Room


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id: Mapped[int] = mapped_column(primary_key=True)
    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id"),
        nullable=False,
    )
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'available'"),
    )

    __table_args__ = (
        CheckConstraint(
            "ends_at > starts_at",
            name="ck_time_slots_ends_after_starts",
        ),
        CheckConstraint(
            "status IN ('available', 'blocked')",
            name="ck_time_slots_status",
        ),
    )

    room: Mapped["Room"] = relationship(
        back_populates="time_slots",
    )
    bookings: Mapped[list["Booking"]] = relationship(
        back_populates="time_slot",
    )
