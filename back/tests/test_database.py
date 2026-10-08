from back.app.database import Base
from back.app.models import Booking, Room, TimeSlot, User


def test_all_mvp_models_are_registered():
    assert set(Base.metadata.tables) == {
        "users",
        "rooms",
        "time_slots",
        "bookings",
    }


def test_booking_has_partial_unique_active_slot_index():
    table = Booking.__table__

    index = next(
        index
        for index in table.indexes
        if index.name == "uq_bookings_active_time_slot"
    )

    assert index.unique is True

    where = index.dialect_options["postgresql"]["where"]

    assert str(where) == (
        "status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')"
    )


def test_models_are_imported():
    assert User.__tablename__ == "users"
    assert Room.__tablename__ == "rooms"
    assert TimeSlot.__tablename__ == "time_slots"
    assert Booking.__tablename__ == "bookings"
