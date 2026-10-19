from back.app.database import Base
from back.app.models import Booking


def test_all_mvp_models_are_registered():
    assert set(Base.metadata.tables) == {
        "users",
        "rooms",
        "time_slots",
        "bookings",
        "game_results",
    }


def test_booking_has_partial_unique_active_slot_index():
    table = Booking.__table__

    index = next(
        index for index in table.indexes if index.name == "uq_bookings_active_time_slot"
    )

    assert index.unique is True

    where = index.dialect_options["postgresql"]["where"]

    assert str(where) == ("status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')")
