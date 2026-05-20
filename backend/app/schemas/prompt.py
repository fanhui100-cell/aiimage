# backend/app/schemas/prompt.py
from typing import Optional
from pydantic import BaseModel


class PromptStatOut(BaseModel):
    view_count: int
    copy_count: int
    favorite_count: int


class PromptOut(BaseModel):
    id: str
    slug: str
    title: str
    model_name: str
    category: str
    scenario: str
    summary: str
    prompt_zh: str
    prompt_en: str
    tags: list[str]
    variables: list[str]
    usage_tips: list[str]
    difficulty: str
    platform: str
    output_type: str
    aspect_ratio: str
    visual: str
    example_image_url: Optional[str]
    is_premium: bool
    author: str
    popularity: int
    updated_at: str
    stat: Optional[PromptStatOut] = None
    is_favorited: bool = False

    class Config:
        from_attributes = True


class PromptListOut(BaseModel):
    total: int
    items: list[PromptOut]


class FavoriteToggleOut(BaseModel):
    favorited: bool
    favorite_count: int


class PromptPackRequest(BaseModel):
    slugs: list[str]
