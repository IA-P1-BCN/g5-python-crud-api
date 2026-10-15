from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.app.core.datetimes import as_utc
from back.app.database import Base
from back.app.models.booking import ACTIVE_STATUSES

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
        Index("ix_time_slots_room_starts", "room_id", "starts_at"),
    )

    room: Mapped["Room"] = relationship(
        back_populates="time_slots",
    )
    bookings: Mapped[list["Booking"]] = relationship(
        back_populates="time_slot",
    )

    @property
    def is_blocked(self) -> bool:
        return self.status == "blocked"

    @property
    def is_taken(self) -> bool:
        return any(b.status in ACTIVE_STATUSES for b in self.bookings)

    @property
    def is_bookable(self) -> bool:
        if self.status != "available":
            return False
        return not self.is_taken

    @property
    def state(self) -> str:
        if as_utc(self.ends_at) <= datetime.now(UTC):
            return "past"
        if self.is_blocked:
            return "blocked"
        if self.is_taken:
            return "taken"
        return "free"
