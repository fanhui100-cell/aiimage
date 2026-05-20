import uuid
from sqlalchemy import Column, String, Text, Boolean
from app.database import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    platform = Column(String(50), nullable=False)   # taobao | pdd | douyin | universal
    category = Column(String(50), nullable=False)   # scene | style | background
    size = Column(String(20), nullable=False)        # 1024x1024 | 1024x1280
    prompt_template = Column(Text, nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, nullable=False, server_default="true")
