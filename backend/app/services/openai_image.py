# backend/app/services/openai_image.py
"""
gpt-image-1 API model image generation.
Billing is token-based: image input $8/1M tokens, output $30/1M tokens.
Actual cost varies by size, quality, and whether reference image is provided.
Monitor OpenAI dashboard to calibrate credit pricing.
Returns (image_bytes: bytes, output_tokens: int).
"""
import base64
import io
import openai
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url="https://api.302.ai/v1",
)

async def generate_from_text(prompt: str, size: str = "1024x1024") -> tuple[bytes, int]:
    """Text-to-image. Returns (image_bytes, output_tokens)."""
    try:
        response = await client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size=size,
            quality="medium",
            n=1,
        )
    except openai.OpenAIError as e:
        raise RuntimeError(f"Image generation failed: {e}") from e
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
    try:
        response = await client.images.edit(
            model="gpt-image-1",
            image=img_file,
            prompt=prompt,
            size=size,
            n=1,
        )
    except openai.OpenAIError as e:
        raise RuntimeError(f"Image generation failed: {e}") from e
    image_b64 = response.data[0].b64_json
    tokens = response.usage.output_tokens if response.usage else 0
    return base64.b64decode(image_b64), tokens
