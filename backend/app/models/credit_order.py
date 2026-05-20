import uuid
from sqlalchemy import Column, String, Integer, DateTime, Numeric, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class CreditOrder(Base):
    __tablename__ = "credit_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    amount_cny = Column(Numeric(10, 2), nullable=False)
    credits = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")  # pending | paid | failed
    payment_channel = Column(String(20), nullable=True)
    external_order_id = Column(String(100), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
