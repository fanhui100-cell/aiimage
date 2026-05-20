# backend/app/routers/history.py
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.generation import Generation
from app.models.user import User

router = APIRouter()

@router.get("/")
def list_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * page_size
    now = datetime.utcnow()
    rows = (
        db.query(Generation)
        .filter(
            Generation.user_id == current_user.id,
            Generation.status == "success",
            Generation.expires_at > now,
            Generation.image_url.isnot(None),
        )
        .order_by(Generation.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return {
        "items": [
            {
                "id": r.id,
                "image_url": r.image_url,
                "mode": r.mode,
                "credits_used": r.credits_used,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
        "page": page,
        "page_size": page_size,
    }
