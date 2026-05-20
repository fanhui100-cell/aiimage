# backend/app/services/storage.py
import uuid
import boto3
from botocore.config import Config
from app.config import settings

_s3 = None

def _get_s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY,
            aws_secret_access_key=settings.R2_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
    return _s3

def upload_image(image_bytes: bytes, user_id: str) -> str:
    """Upload image to R2. Returns public URL."""
    key = f"generations/{user_id}/{uuid.uuid4()}.png"
    _get_s3().put_object(
        Bucket=settings.R2_BUCKET,
        Key=key,
        Body=image_bytes,
        ContentType="image/png",
    )
    return f"{settings.R2_PUBLIC_URL}/{key}"

def delete_image(image_url: str) -> None:
    """Delete image from R2 by its public URL."""
    key = image_url.removeprefix(settings.R2_PUBLIC_URL + "/")
    try:
        _get_s3().delete_object(Bucket=settings.R2_BUCKET, Key=key)
    except Exception:
        pass  # best-effort deletion
