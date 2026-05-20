# backend/app/services/credit_estimator.py
"""
Conservative credit cost estimate per generation.
Based on OpenAI token billing (output $30/1M tokens, medium quality).
Must be calibrated against real API bills after launch.

Current rules (conservative):
- Base text generation: 1 credit
- With reference image (image edit mode, more tokens): +1 credit
- Large canvas (1024x1280 or wider): +1 credit
"""

LARGE_SIZES = frozenset({"1024x1280", "1280x1024"})

def estimate_credits(has_reference_image: bool, size: str = "1024x1024") -> int:
    base = 2 if has_reference_image else 1
    if size in LARGE_SIZES:
        base += 1
    return base
