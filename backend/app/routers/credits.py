import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import update as sql_update
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.credit_order import CreditOrder
from app.models.user import User
from app.schemas.credit import CreateOrderRequest, CreateOrderResponse, PackageInfo
from app.services.payment import PACKAGES, create_payment_order, get_package, verify_webhook

router = APIRouter()


@router.get("/packages")
def list_packages():
    return [
        PackageInfo(
            id=package_id,
            name=info["name"],
            price_cny=info["price_cny"],
            credits=info["credits"],
            description=f"¥{info['price_cny']} / {info['credits']} 张",
        )
        for package_id, info in PACKAGES.items()
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
        package = get_package(body.package_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    order_id = str(uuid.uuid4())
    base_url = str(request.base_url).rstrip("/")
    notify_url = f"{base_url}/api/credits/webhook"
    return_url = f"{settings.FRONTEND_URL}/credits?status=success"

    try:
        pay_url = await create_payment_order(order_id, body.package_id, notify_url, return_url)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    order = CreditOrder(
        id=order_id,
        user_id=current_user.id,
        amount_cny=package["price_cny"],
        credits=package["credits"],
        status="pending",
    )
    db.add(order)
    db.commit()

    return CreateOrderResponse(
        order_id=order_id,
        pay_url=pay_url,
        amount_cny=package["price_cny"],
        credits=package["credits"],
    )


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """Process successful payment callbacks and credit the user account."""
    form = dict(await request.form())
    if not verify_webhook(form):
        return {"errcode": 1, "errmsg": "签名错误"}

    order_id = form.get("trade_order_id")
    if not order_id:
        return {"errcode": 1, "errmsg": "缺少订单号"}

    order = db.get(CreditOrder, order_id)
    if not order:
        return {"errcode": 0, "errmsg": "ok"}

    result = db.execute(
        sql_update(CreditOrder)
        .where(CreditOrder.id == order.id, CreditOrder.status == "pending")
        .values(
            status="paid",
            payment_channel=form.get("channel", ""),
            external_order_id=form.get("transaction_id") or None,
            paid_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    if result.rowcount == 0:
        return {"errcode": 0, "errmsg": "ok"}

    db.execute(
        sql_update(User)
        .where(User.id == order.user_id)
        .values(credit_balance=User.credit_balance + order.credits, tier="paid")
    )
    db.commit()
    return {"errcode": 0, "errmsg": "ok"}
