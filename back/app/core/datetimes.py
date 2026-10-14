from datetime import UTC, datetime


def as_utc(value: datetime) -> datetime:
    """Normalize a datetime to UTC.

    SQLite (used by the test suite) stores datetimes without timezone
    information, so values read back from the database are naive. They are
    assumed to already be UTC (BR-X5).
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
