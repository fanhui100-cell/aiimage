from datetime import datetime, time as dt_time, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models.generation import Generation
from app.models.user import User


def check_daily_limit(user: User, db: Session) -> None:
    """Raise 429 if a free user exceeded the daily generation limit."""
    if user.tier == "paid":
        return

    today_utc = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today_utc, dt_time.min, tzinfo=timezone.utc)
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
