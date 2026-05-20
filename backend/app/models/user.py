import uuid
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone = Column(String(20), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=True)
    credit_balance = Column(Integer, default=0, nullable=False)
    tier = Column(String(20), default="free", nullable=False)  # free | paid
    created_at = Column(DateTime, server_default=func.now())
