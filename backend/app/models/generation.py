import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Generation(Base):
    __tablename__ = "generations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    mode = Column(String(20), nullable=False)  # template | keyword | custom
    prompt = Column(Text, nullable=False)
    template_id = Column(String(36), ForeignKey("templates.id"), nullable=True)
    image_url = Column(String(500), nullable=True)
    credits_used = Column(Integer, nullable=False, server_default="0")
    tokens_used = Column(Integer, nullable=False, server_default="0")
    status = Column(String(20), nullable=False, server_default="pending")  # pending | success | failed | expired
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
