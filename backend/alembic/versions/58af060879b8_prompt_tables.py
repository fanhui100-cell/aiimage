"""prompt_tables

Revision ID: 58af060879b8
Revises: 89ce6001fd80
Create Date: 2026-05-21 00:33:58.508335

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '58af060879b8'
down_revision: Union[str, Sequence[str], None] = '89ce6001fd80'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create prompt, prompt_favorites, and prompt_stats tables."""
    op.create_table(
        "prompts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("model_name", sa.String(50), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("scenario", sa.String(200), nullable=False),
        sa.Column("summary", sa.Text, nullable=False),
        sa.Column("prompt_zh", sa.Text, nullable=False),
        sa.Column("prompt_en", sa.Text, nullable=False),
        sa.Column("tags", postgresql.JSONB, nullable=False, server_default="'[]'::jsonb"),
        sa.Column("variables", postgresql.JSONB, nullable=False, server_default="'[]'::jsonb"),
        sa.Column("usage_tips", postgresql.JSONB, nullable=False, server_default="'[]'::jsonb"),
        sa.Column("difficulty", sa.String(10), nullable=False),
        sa.Column("platform", sa.String(100), nullable=False),
        sa.Column("output_type", sa.String(50), nullable=False),
        sa.Column("aspect_ratio", sa.String(20), nullable=False),
        sa.Column("visual", sa.String(30), nullable=False, server_default="'product'"),
        sa.Column("example_image_url", sa.String(500), nullable=True),
        sa.Column("is_premium", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("author", sa.String(100), nullable=False, server_default="'Prompt123 编辑部'"),
        sa.Column("popularity", sa.Integer, nullable=False, server_default="0"),
        sa.Column("updated_at", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_prompts_slug", "prompts", ["slug"], unique=True)
    op.create_index("ix_prompts_model_name", "prompts", ["model_name"])
    op.create_index("ix_prompts_category", "prompts", ["category"])

    op.create_table(
        "prompt_favorites",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("prompt_id", sa.String(36), sa.ForeignKey("prompts.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "prompt_id", name="uq_user_prompt_favorite"),
    )
    op.create_index("ix_prompt_favorites_user_id", "prompt_favorites", ["user_id"])
    op.create_index("ix_prompt_favorites_prompt_id", "prompt_favorites", ["prompt_id"])

    op.create_table(
        "prompt_stats",
        sa.Column("prompt_id", sa.String(36), sa.ForeignKey("prompts.id"), primary_key=True),
        sa.Column("view_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("copy_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("favorite_count", sa.Integer, nullable=False, server_default="0"),
    )


def downgrade() -> None:
    """Drop prompt tables in reverse dependency order."""
    op.drop_table("prompt_stats")
    op.drop_table("prompt_favorites")
    op.drop_index("ix_prompts_category", table_name="prompts")
    op.drop_index("ix_prompts_model_name", table_name="prompts")
    op.drop_index("ix_prompts_slug", table_name="prompts")
    op.drop_table("prompts")
