"""forbid overlapping time slots of a room in the database (BR-S3)

Revision ID: 6e7f8091a2b3
Revises: 5d6e7f8091a2
Create Date: 2026-10-15 17:00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "6e7f8091a2b3"
down_revision: str | Sequence[str] | None = "5d6e7f8091a2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return
    pairs = (
        op.get_bind()
        .execute(
            sa.text(
                "SELECT a.id, b.id, a.room_id FROM time_slots a "
                "JOIN time_slots b ON a.room_id = b.room_id AND a.id < b.id "
                "AND tstzrange(a.starts_at, a.ends_at) && tstzrange(b.starts_at, b.ends_at) "
                "ORDER BY a.room_id, a.id LIMIT 20"
            )
        )
        .all()
    )
    if pairs:
        listed = ", ".join(f"{a}/{b} (room {room})" for a, b, room in pairs)
        raise RuntimeError(
            "Overlapping time slots found, fix or delete them, then upgrade again. "
            f"Slot id pairs (first 20): {listed}"
        )
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.execute(
        "ALTER TABLE time_slots ADD CONSTRAINT ex_time_slots_no_overlap "
        "EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &&)"
    )


def downgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return
    op.execute("ALTER TABLE time_slots DROP CONSTRAINT ex_time_slots_no_overlap")
