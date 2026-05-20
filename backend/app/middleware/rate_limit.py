# backend/app/middleware/rate_limit.py
from datetime import datetime, date, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.generation import Generation
from app.models.user import User
from app.config import settings

def check_daily_limit(user: User, db: Session) -> None:
    """Raise 429 if free user exceeded daily generation limit."""
    if user.tier == "paid":
        return
    today_utc = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today_utc, datetime.min.time())  # naive UTC midnight
    count = (
        db.query(Generation)
        .filter(
            Generation.user_id == user.id,
            Generation.status == "success",
            Generation.created_at >= today_start,
        )
        .count()
    )
    if count >= settings.MAX_DAILY_FREE_GENERATIONS:
        raise HTTPException(
            status_code=429,
            detail=f"免费用户每日限 {settings.MAX_DAILY_FREE_GENERATIONS} 次生成，请充值升级",
        )
