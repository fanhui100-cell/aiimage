# backend/app/services/openai_image.py
"""
GPT-Image-1 (marketed as GPT-Image-2) image generation.
Billing is token-based: image input $8/1M tokens, output $30/1M tokens.
Actual cost varies by size, quality, and whether reference image is provided.
Monitor OpenAI dashboard to calibrate credit pricing.
Returns (image_bytes: bytes, output_tokens: int).
"""
import base64
import io
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def generate_from_text(prompt: str, size: str = "1024x1024") -> tuple[bytes, int]:
    """Text-to-image. Returns (image_bytes, output_tokens)."""
    response = await client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size=size,
        quality="medium",
        n=1,
    )
    image_b64 = response.data[0].b64_json
    tokens = response.usage.output_tokens if response.usage else 0
    return base64.b64decode(image_b64), tokens

async def generate_from_reference(
    prompt: str,
    reference_bytes: bytes,
    size: str = "1024x1024",
) -> tuple[bytes, int]:
    """Image edit with reference. Returns (image_bytes, output_tokens)."""
    img_file = io.BytesIO(reference_bytes)
    img_file.name = "reference.png"
    response = await client.images.edit(
        model="gpt-image-1",
        image=img_file,
        prompt=prompt,
        size=size,
        n=1,
    )
    image_b64 = response.data[0].b64_json
    tokens = response.usage.output_tokens if response.usage else 0
    return base64.b64decode(image_b64), tokens
