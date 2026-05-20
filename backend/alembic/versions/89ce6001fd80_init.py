"""init

Revision ID: 89ce6001fd80
Revises:
Create Date: 2026-05-20 20:11:15.021761

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89ce6001fd80'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables for the initial schema."""
    # users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('phone', sa.String(20), unique=True, nullable=True),
        sa.Column('email', sa.String(255), unique=True, nullable=True),
        sa.Column('credit_balance', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tier', sa.String(20), nullable=False, server_default='free'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('ix_users_phone', 'users', ['phone'])

    # templates table (no FK deps)
    op.create_table(
        'templates',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('platform', sa.String(50), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('size', sa.String(20), nullable=False),
        sa.Column('prompt_template', sa.Text(), nullable=False),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    )

    # credit_orders table
    op.create_table(
        'credit_orders',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('amount_cny', sa.Numeric(10, 2), nullable=False),
        sa.Column('credits', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('payment_channel', sa.String(20), nullable=True),
        sa.Column('external_order_id', sa.String(100), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('ix_credit_orders_user_id', 'credit_orders', ['user_id'])

    # generations table (FK -> users)
    op.create_table(
        'generations',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('mode', sa.String(20), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('template_id', sa.String(36), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('credits_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tokens_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('ix_generations_user_id', 'generations', ['user_id'])


def downgrade() -> None:
    """Drop all tables in reverse dependency order."""
    op.drop_index('ix_generations_user_id', table_name='generations')
    op.drop_table('generations')

    op.drop_index('ix_credit_orders_user_id', table_name='credit_orders')
    op.drop_table('credit_orders')

    op.drop_table('templates')

    op.drop_index('ix_users_phone', table_name='users')
    op.drop_table('users')
