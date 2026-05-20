# backend/app/services/prompt_builder.py
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = (
    "You are an expert at writing image generation prompts for e-commerce product photography. "
    "Convert Chinese keywords into a concise, descriptive English prompt suitable for GPT-Image-1. "
    "Focus on visual style, lighting, background, and product description. "
    "Output only the prompt text, no explanations, max 150 words."
)

async def expand_keywords(keywords: str) -> str:
    if not keywords.strip():
        raise ValueError("Keywords cannot be empty")
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Keywords: {keywords}"},
        ],
        max_tokens=200,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
