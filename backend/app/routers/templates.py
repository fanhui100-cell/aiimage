# backend/app/routers/templates.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.template import Template

router = APIRouter()

@router.get("/")
def list_templates(platform: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Template).filter(Template.is_active == True)
    if platform:
        q = q.filter(Template.platform == platform)
    return [
        {
            "id": t.id,
            "name": t.name,
            "platform": t.platform,
            "category": t.category,
            "size": t.size,
            "thumbnail_url": t.thumbnail_url,
        }
        for t in q.all()
    ]
