# backend/app/routers/generations.py
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rate_limit import check_daily_limit
from app.models.user import User
from app.models.generation import Generation
from app.models.template import Template
from app.schemas.generation import EstimateRequest, EstimateResponse, GenerateResponse
from app.services.credit_estimator import estimate_credits
from app.services.prompt_builder import expand_keywords
from app.services.openai_image import generate_from_text, generate_from_reference
from app.services.storage import upload_image

router = APIRouter()

def _expires_at(user: User) -> datetime:
    days = 30 if user.tier == "paid" else 7
    return datetime.utcnow() + timedelta(days=days)

def _save_generation(
    db: Session, user: User, mode: str, prompt: str,
    image_url: str, credits: int, tokens: int, template_id: str | None = None,
) -> Generation:
    user.credit_balance -= credits
    gen = Generation(
        user_id=user.id, mode=mode, prompt=prompt,
        template_id=template_id, image_url=image_url,
        credits_used=credits, tokens_used=tokens,
        status="success", expires_at=_expires_at(user),
    )
    db.add(gen)
    db.commit()
    db.refresh(gen)
    return gen

@router.post("/estimate", response_model=EstimateResponse)
def estimate(
    body: EstimateRequest,
    current_user: User = Depends(get_current_user),
):
    credits = estimate_credits(body.has_reference_image, body.size)
    return EstimateResponse(credits_required=credits)

@router.post("/keyword", response_model=GenerateResponse)
async def generate_keyword(
    keywords: str = Form(...),
    reference_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_daily_limit(current_user, db)
    ref_bytes = await reference_image.read() if reference_image else None
    credits = estimate_credits(has_reference_image=bool(ref_bytes))
    if current_user.credit_balance < credits:
        raise HTTPException(status_code=402, detail="积分不足，请充值")
    try:
        prompt = await expand_keywords(keywords)
        if ref_bytes:
            image_bytes, tokens = await generate_from_reference(prompt, ref_bytes)
        else:
            image_bytes, tokens = await generate_from_text(prompt)
        url = upload_image(image_bytes, current_user.id)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    gen = _save_generation(db, current_user, "keyword", prompt, url, credits, tokens)
    return GenerateResponse(id=gen.id, image_url=url, credits_used=credits, credits_remaining=current_user.credit_balance)

@router.post("/template/{template_id}", response_model=GenerateResponse)
async def generate_template(
    template_id: str,
    product_description: str = Form(...),
    reference_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_daily_limit(current_user, db)
    template = db.get(Template, template_id)
    if not template or not template.is_active:
        raise HTTPException(status_code=404, detail="模板不存在")
    ref_bytes = await reference_image.read() if reference_image else None
    credits = estimate_credits(has_reference_image=bool(ref_bytes), size=template.size)
    if current_user.credit_balance < credits:
        raise HTTPException(status_code=402, detail="积分不足，请充值")
    try:
        prompt = template.prompt_template.replace("{product_description}", product_description)
        if ref_bytes:
            image_bytes, tokens = await generate_from_reference(prompt, ref_bytes, template.size)
        else:
            image_bytes, tokens = await generate_from_text(prompt, template.size)
        url = upload_image(image_bytes, current_user.id)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    gen = _save_generation(db, current_user, "template", prompt, url, credits, tokens, template_id)
    return GenerateResponse(id=gen.id, image_url=url, credits_used=credits, credits_remaining=current_user.credit_balance)

@router.post("/custom", response_model=GenerateResponse)
async def generate_custom(
    prompt: str = Form(...),
    reference_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_daily_limit(current_user, db)
    ref_bytes = await reference_image.read() if reference_image else None
    credits = estimate_credits(has_reference_image=bool(ref_bytes))
    if current_user.credit_balance < credits:
        raise HTTPException(status_code=402, detail="积分不足，请充值")
    try:
        if ref_bytes:
            image_bytes, tokens = await generate_from_reference(prompt, ref_bytes)
        else:
            image_bytes, tokens = await generate_from_text(prompt)
        url = upload_image(image_bytes, current_user.id)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    gen = _save_generation(db, current_user, "custom", prompt, url, credits, tokens)
    return GenerateResponse(id=gen.id, image_url=url, credits_used=credits, credits_remaining=current_user.credit_balance)
