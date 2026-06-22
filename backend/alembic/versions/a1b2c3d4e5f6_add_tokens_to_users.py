"""add tokens to users

Revision ID: a1b2c3d4e5f6
Revises: ef9347346a27
Create Date: 2026-06-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'ef9347346a27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('tokens', sa.Integer(), nullable=False, server_default='2'))


def downgrade() -> None:
    op.drop_column('users', 'tokens')
