# backend/app/routers/auth.py
import re
import redis as redis_lib
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import SendCodeRequest, LoginRequest, LoginResponse
from app.services.sms import generate_code, send_sms_code
from app.middleware.auth import create_jwt

router = APIRouter()
redis_client = redis_lib.from_url(settings.REDIS_URL, decode_responses=False)

@router.post("/send-code")
def send_code(body: SendCodeRequest):
    if not re.match(r"^1[3-9]\d{9}$", body.phone):
        raise HTTPException(status_code=422, detail="请输入正确的手机号")
    code = generate_code()
    send_sms_code(body.phone, code)
    redis_client.setex(f"sms:{body.phone}", 300, code.encode())
    return {"message": "验证码已发送"}

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    stored = redis_client.get(f"sms:{body.phone}")
    if not stored or stored.decode() != body.code:
        raise HTTPException(status_code=400, detail="验证码错误或已过期")
    redis_client.delete(f"sms:{body.phone}")

    user = db.query(User).filter(User.phone == body.phone).first()
    if not user:
        user = User(phone=body.phone, credit_balance=3, tier="free")
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.phone == body.phone).first()

    token = create_jwt(user.id)
    return LoginResponse(token=token, credit_balance=user.credit_balance, tier=user.tier)
