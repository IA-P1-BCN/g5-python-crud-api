"""forbid overlapping time slots of a room in the database (BR-S3)

Revision ID: 6e7f8091a2b3
Revises: 5d6e7f8091a2
Create Date: 2026-10-15 17:00:00

"""

from collections.abc import Sequence

from alembic import op

revision: str = "6e7f8091a2b3"
down_revision: str | Sequence[str] | None = "5d6e7f8091a2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.execute(
        "ALTER TABLE time_slots ADD CONSTRAINT ex_time_slots_no_overlap "
        "EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &&)"
    )


def downgrade() -> None:
    if op.get_bind().dialect.name != "postgresql":
        return
    op.execute("ALTER TABLE time_slots DROP CONSTRAINT ex_time_slots_no_overlap")
