# backend/scripts/cleanup_expired.py
"""
Delete expired generation records and their R2 images.
Run daily via cron: cd /app && poetry run python scripts/cleanup_expired.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime
from app.database import SessionLocal
from app.models.generation import Generation
from app.services.storage import delete_image

def cleanup():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        expired = (
            db.query(Generation)
            .filter(Generation.expires_at <= now, Generation.image_url.isnot(None))
            .all()
        )
        count = 0
        for gen in expired:
            try:
                delete_image(gen.image_url)
            except Exception as e:
                print(f"Warning: R2 delete failed for {gen.id}: {e}")
            gen.image_url = None
            gen.status = "expired"
            count += 1
        db.commit()
        print(f"Cleaned up {count} expired generations at {now.isoformat()}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
