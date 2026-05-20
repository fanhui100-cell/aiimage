# backend/app/schemas/generation.py
from pydantic import BaseModel
from typing import Optional

class EstimateRequest(BaseModel):
    mode: str
    has_reference_image: bool = False
    size: str = "1024x1024"

class EstimateResponse(BaseModel):
    credits_required: int

class GenerateResponse(BaseModel):
    id: str
    image_url: str
    credits_used: int
    credits_remaining: int
