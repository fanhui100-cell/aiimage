# backend/app/routers/credits.py
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.credit_order import CreditOrder
from app.schemas.credit import PackageInfo, CreateOrderRequest, CreateOrderResponse
from app.services.payment import PACKAGES, get_package, create_payment_order, verify_webhook

router = APIRouter()

@router.get("/packages")
def list_packages():
    return [
        PackageInfo(
            id=pkg_id,
            name=info["name"],
            price_cny=info["price_cny"],
            credits=info["credits"],
            description=f"¥{info['price_cny']} / {info['credits']}张",
        )
        for pkg_id, info in PACKAGES.items()
    ]

@router.get("/balance")
def get_balance(current_user: User = Depends(get_current_user)):
    return {"credit_balance": current_user.credit_balance, "tier": current_user.tier}

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(
    body: CreateOrderRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        pkg = get_package(body.package_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    order_id = str(uuid.uuid4())
    base_url = str(request.base_url).rstrip("/")
    notify_url = f"{base_url}/api/credits/webhook"
    return_url = f"{base_url.replace(':8000', ':3000')}/credits?status=success"

    try:
        pay_url = await create_payment_order(order_id, body.package_id, notify_url, return_url)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    order = CreditOrder(
        id=order_id,
        user_id=current_user.id,
        amount_cny=pkg["price_cny"],
        credits=pkg["credits"],
        status="pending",
    )
    db.add(order)
    db.commit()

    return CreateOrderResponse(
        order_id=order_id,
        pay_url=pay_url,
        amount_cny=pkg["price_cny"],
        credits=pkg["credits"],
    )

@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """Hupijiao payment callback — processes successful payments and credits user."""
    form = dict(await request.form())
    if not verify_webhook(dict(form)):
        return {"errcode": 1, "errmsg": "签名错误"}

    order_id = form.get("trade_order_id")
    if not order_id:
        return {"errcode": 1, "errmsg": "缺少订单号"}

    order = db.get(CreditOrder, order_id)
    if not order or order.status == "paid":
        return {"errcode": 0, "errmsg": "ok"}  # idempotent

    order.status = "paid"
    order.payment_channel = form.get("channel", "")
    order.external_order_id = form.get("transaction_id") or None
    order.paid_at = datetime.utcnow()

    user = db.get(User, order.user_id)
    if user:
        user.credit_balance += order.credits
        if user.tier == "free":
            user.tier = "paid"

    db.commit()
    return {"errcode": 0, "errmsg": "ok"}
