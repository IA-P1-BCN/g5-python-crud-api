"""add catalog fields to rooms

Revision ID: 2a3b4c5d6e7f
Revises: 11f302616e11
Create Date: 2026-10-08 15:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '2a3b4c5d6e7f'
down_revision: str | None = '11f302616e11'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('rooms', sa.Column('slug', sa.String(length=255), nullable=False, server_default='room-default'))
    op.add_column('rooms', sa.Column('genre', sa.String(length=100), nullable=False, server_default='Mystery'))
    op.add_column('rooms', sa.Column('min_players', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('rooms', sa.Column('difficulty', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('rooms', sa.Column('hook', sa.Text(), nullable=False, server_default=''))
    op.add_column('rooms', sa.Column('story', sa.Text(), nullable=False, server_default=''))
    op.add_column('rooms', sa.Column('audience', sa.String(length=100), nullable=False, server_default='All ages'))
    
    op.create_unique_constraint('uq_rooms_slug', 'rooms', ['slug'])


def downgrade() -> None:
    op.drop_constraint('uq_rooms_slug', 'rooms', type_='unique')
    op.drop_column('rooms', 'audience')
    op.drop_column('rooms', 'story')
    op.drop_column('rooms', 'hook')
    op.drop_column('rooms', 'difficulty')
    op.drop_column('rooms', 'min_players')
    op.drop_column('rooms', 'genre')
    op.drop_column('rooms', 'slug')