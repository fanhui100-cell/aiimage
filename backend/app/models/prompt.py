import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    model_name = Column(String(50), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    scenario = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    prompt_zh = Column(Text, nullable=False)
    prompt_en = Column(Text, nullable=False)
    tags = Column(JSONB, nullable=False, server_default="'[]'::jsonb")
    variables = Column(JSONB, nullable=False, server_default="'[]'::jsonb")
    usage_tips = Column(JSONB, nullable=False, server_default="'[]'::jsonb")
    difficulty = Column(String(10), nullable=False)
    platform = Column(String(100), nullable=False)
    output_type = Column(String(50), nullable=False)
    aspect_ratio = Column(String(20), nullable=False)
    visual = Column(String(30), nullable=False, server_default="'product'")
    example_image_url = Column(String(500), nullable=True)
    is_premium = Column(Boolean, nullable=False, server_default="false")
    author = Column(String(100), nullable=False, server_default="'Prompt123 编辑部'")
    popularity = Column(Integer, nullable=False, server_default="0")
    updated_at = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PromptFavorite(Base):
    __tablename__ = "prompt_favorites"
    __table_args__ = (UniqueConstraint("user_id", "prompt_id", name="uq_user_prompt_favorite"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PromptStat(Base):
    __tablename__ = "prompt_stats"

    prompt_id = Column(String(36), ForeignKey("prompts.id"), primary_key=True)
    view_count = Column(Integer, nullable=False, server_default="0")
    copy_count = Column(Integer, nullable=False, server_default="0")
    favorite_count = Column(Integer, nullable=False, server_default="0")
