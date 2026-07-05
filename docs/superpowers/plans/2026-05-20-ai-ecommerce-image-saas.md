# AI 电商商品图 SaaS - MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建面向国内电商卖家的 AI 商品图批量生成 SaaS，4 周内上线可收款的 MVP。

**Architecture:** FastAPI 后端部署 AWS 新加坡，代理调用 OpenAI GPT-Image-2 API；Next.js 14 前端部署 Vercel；国内用户直接访问，无需翻墙。积分制计费，虎皮椒接收微信+支付宝。

**Tech Stack:** Python 3.12 + FastAPI + SQLAlchemy 2 + PostgreSQL 16 + Redis 7 | Next.js 14 (App Router) + Tailwind CSS 3 | OpenAI Python SDK | boto3 (Cloudflare R2) | 虎皮椒支付

---

## 文件结构

```
project/
├── backend/
│   ├── pyproject.toml
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/env.py
│   ├── alembic/versions/
│   └── app/
│       ├── main.py                  # FastAPI 入口
│       ├── config.py                # 环境变量
│       ├── database.py              # DB session
│       ├── models/
│       │   ├── user.py
│       │   ├── credit_order.py
│       │   ├── generation.py
│       │   └── template.py
│       ├── schemas/
│       │   ├── user.py
│       │   ├── generation.py
│       │   └── credit.py
│       ├── routers/
│       │   ├── auth.py
│       │   ├── generations.py
│       │   ├── credits.py
│       │   ├── templates.py
│       │   └── history.py
│       ├── services/
│       │   ├── sms.py               # 阿里云短信
│       │   ├── openai_image.py      # GPT-Image-2 调用
│       │   ├── prompt_builder.py    # 中文关键词 → 英文 Prompt
│       │   ├── credit_estimator.py  # 生成前积分预估
│       │   ├── storage.py           # Cloudflare R2
│       │   └── payment.py           # 虎皮椒支付
│       ├── middleware/
│       │   ├── auth.py              # JWT 验证
│       │   └── rate_limit.py        # 每日限额
│       └── tests/
│           ├── conftest.py
│           ├── test_auth.py
│           ├── test_prompt_builder.py
│           ├── test_credit_estimator.py
│           └── test_generation.py
├── frontend/
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # 落地页
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx       # 主生成页
│   │   ├── history/page.tsx
│   │   ├── credits/page.tsx
│   │   └── legal/
│   │       ├── terms/page.tsx
│   │       ├── privacy/page.tsx
│   │       ├── refund/page.tsx
│   │       ├── disclaimer/page.tsx
│   │       └── authorization/page.tsx
│   ├── components/
│   │   ├── GenerateForm.tsx
│   │   ├── TemplateSelector.tsx
│   │   ├── CreditEstimate.tsx
│   │   ├── ImageResult.tsx
│   │   └── PaymentModal.tsx
│   └── lib/
│       ├── api.ts
│       └── auth.ts
└── docker-compose.yml               # 本地开发 PG + Redis
```

---

## Task 1: 项目脚手架

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p project/{backend/app/{models,schemas,routers,services,middleware,tests},frontend}
cd project
```

- [ ] **Step 2: 创建 docker-compose.yml（本地开发用）**

```yaml
# docker-compose.yml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: aiimage
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

- [ ] **Step 3: 启动本地数据库**

```bash
docker compose up -d
```

Expected: postgres 和 redis 容器正常运行。

- [ ] **Step 4: 创建 backend/pyproject.toml**

```toml
[tool.poetry]
name = "ai-image-backend"
version = "0.1.0"
python = "^3.12"

[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.115"
uvicorn = {extras = ["standard"], version = "^0.30"}
sqlalchemy = "^2.0"
alembic = "^1.13"
psycopg2-binary = "^2.9"
redis = "^5.0"
python-jose = {extras = ["cryptography"], version = "^3.3"}
passlib = {extras = ["bcrypt"], version = "^1.7"}
pydantic-settings = "^2.3"
openai = "^1.35"
boto3 = "^1.34"
pillow = "^10.3"
httpx = "^0.27"
aliyun-python-sdk-core = "^2.15"
aliyun-python-sdk-dysmsapi = "^2.0"
python-multipart = "^0.0.9"

[tool.poetry.group.dev.dependencies]
pytest = "^8.2"
pytest-asyncio = "^0.23"
httpx = "^0.27"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

- [ ] **Step 5: 安装依赖**

```bash
cd backend && poetry install
```

- [ ] **Step 6: 创建 backend/.env.example**

```env
DATABASE_URL=postgresql://dev:devpass@localhost:5432/aiimage
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-to-a-random-64-char-string
OPENAI_API_KEY=sk-...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=ai-image-prod
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://images.yourdomain.com
ALIYUN_SMS_KEY=...
ALIYUN_SMS_SECRET=...
ALIYUN_SMS_SIGN=你的签名
ALIYUN_SMS_TEMPLATE=SMS_xxxxx
HUPIJIAO_KEY=...
HUPIJIAO_SECRET=...
MAX_DAILY_FREE_GENERATIONS=1
```

```bash
cp backend/.env.example backend/.env
# 填入真实值
```

- [ ] **Step 7: 创建 app/config.py**

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    JWT_SECRET: str
    JWT_EXPIRE_HOURS: int = 24 * 7
    OPENAI_API_KEY: str
    R2_ACCESS_KEY: str
    R2_SECRET_KEY: str
    R2_BUCKET: str
    R2_ENDPOINT: str
    R2_PUBLIC_URL: str
    ALIYUN_SMS_KEY: str
    ALIYUN_SMS_SECRET: str
    ALIYUN_SMS_SIGN: str
    ALIYUN_SMS_TEMPLATE: str
    HUPIJIAO_KEY: str
    HUPIJIAO_SECRET: str
    MAX_DAILY_FREE_GENERATIONS: int = 1

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 8: 创建 app/database.py**

```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 9: 创建 app/main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, generations, credits, templates, history

app = FastAPI(title="AI Image SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(generations.router, prefix="/api/generate", tags=["generate"])
app.include_router(credits.router, prefix="/api/credits", tags=["credits"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(history.router, prefix="/api/history", tags=["history"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 10: 验证服务启动**

```bash
cd backend && poetry run uvicorn app.main:app --reload
```

Expected: `http://localhost:8000/health` 返回 `{"status":"ok"}`

- [ ] **Step 11: Commit**

```bash
git add . && git commit -m "feat: project scaffold, deps, config"
```

---

## Task 2: 数据库模型 + Migrations

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/credit_order.py`
- Create: `backend/app/models/generation.py`
- Create: `backend/app/models/template.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`

- [ ] **Step 1: 创建 models/user.py**

```python
# backend/app/models/user.py
import uuid
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone = Column(String(20), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=True)
    credit_balance = Column(Integer, default=0, nullable=False)
    tier = Column(String(20), default="free", nullable=False)  # free | paid
    created_at = Column(DateTime, server_default=func.now())
```

- [ ] **Step 2: 创建 models/generation.py**

```python
# backend/app/models/generation.py
import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Generation(Base):
    __tablename__ = "generations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    mode = Column(String(20), nullable=False)  # template | keyword | custom
    prompt = Column(Text, nullable=False)
    template_id = Column(String(36), nullable=True)
    image_url = Column(String(500), nullable=True)
    credits_used = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    status = Column(String(20), default="pending")  # pending | success | failed
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
```

- [ ] **Step 3: 创建 models/credit_order.py**

```python
# backend/app/models/credit_order.py
import uuid
from sqlalchemy import Column, String, Integer, DateTime, Numeric
from sqlalchemy.sql import func
from app.database import Base

class CreditOrder(Base):
    __tablename__ = "credit_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    amount_cny = Column(Numeric(10, 2), nullable=False)   # 实付金额（元）
    credits = Column(Integer, nullable=False)              # 充入积分（张数）
    status = Column(String(20), default="pending")        # pending | paid | failed
    payment_channel = Column(String(20), nullable=True)   # wechat | alipay
    external_order_id = Column(String(100), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
```

- [ ] **Step 4: 创建 models/template.py**

```python
# backend/app/models/template.py
import uuid
from sqlalchemy import Column, String, Text, Boolean
from app.database import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    platform = Column(String(50), nullable=False)   # taobao | pdd | douyin | universal
    category = Column(String(50), nullable=False)   # scene | style | background
    size = Column(String(20), nullable=False)        # 1024x1024 | 1024x1280
    prompt_template = Column(Text, nullable=False)  # 含 {product_description} 占位
    thumbnail_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
```

- [ ] **Step 5: 创建 models/__init__.py（让 alembic 能发现所有模型）**

```python
# backend/app/models/__init__.py
from app.models.user import User
from app.models.generation import Generation
from app.models.credit_order import CreditOrder
from app.models.template import Template
```

- [ ] **Step 6: 初始化 Alembic**

```bash
cd backend && poetry run alembic init alembic
```

- [ ] **Step 7: 修改 alembic/env.py 使其读取模型**

```python
# backend/alembic/env.py（关键部分，替换 target_metadata 相关）
from app.config import settings
from app.database import Base
import app.models  # 触发所有模型注册

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata
```

- [ ] **Step 8: 生成初始 migration**

```bash
cd backend && poetry run alembic revision --autogenerate -m "init"
```

- [ ] **Step 9: 执行 migration**

```bash
cd backend && poetry run alembic upgrade head
```

Expected: 4 张表（users, generations, credit_orders, templates）成功创建。

- [ ] **Step 10: Commit**

```bash
git add . && git commit -m "feat: database models and initial migration"
```

---

## Task 3: 用户认证（手机号 + SMS + JWT）

**Files:**
- Create: `backend/app/services/sms.py`
- Create: `backend/app/middleware/auth.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/routers/auth.py`
- Create: `backend/app/tests/conftest.py`
- Create: `backend/app/tests/test_auth.py`

- [ ] **Step 1: 编写失败测试**

```python
# backend/app/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

TEST_DB = "sqlite:///./test.db"
engine = create_engine(TEST_DB, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    def override_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_db
    return TestClient(app)
```

```python
# backend/app/tests/test_auth.py
from unittest.mock import patch

def test_send_code_returns_200(client):
    with patch("app.routers.auth.send_sms_code") as mock_sms:
        mock_sms.return_value = None
        resp = client.post("/api/auth/send-code", json={"phone": "13800138000"})
    assert resp.status_code == 200

def test_login_with_wrong_code_returns_400(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"123456"
        resp = client.post("/api/auth/login", json={"phone": "13800138000", "code": "000000"})
    assert resp.status_code == 400

def test_login_creates_user_and_returns_token(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"123456"
        resp = client.post("/api/auth/login", json={"phone": "13800138000", "code": "123456"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["credit_balance"] == 3  # 新用户赠送 3 张
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd backend && poetry run pytest app/tests/test_auth.py -v
```

Expected: FAIL - routers/auth.py 不存在

- [ ] **Step 3: 创建 services/sms.py**

```python
# backend/app/services/sms.py
from aliyunsdkcore.client import AcsClient
from aliyunsdkdysmsapi.request.v20170525.SendSmsRequest import SendSmsRequest
from app.config import settings
import json, random

def generate_code() -> str:
    return str(random.randint(100000, 999999))

def send_sms_code(phone: str, code: str) -> None:
    client = AcsClient(settings.ALIYUN_SMS_KEY, settings.ALIYUN_SMS_SECRET, "cn-hangzhou")
    request = SendSmsRequest()
    request.set_PhoneNumbers(phone)
    request.set_SignName(settings.ALIYUN_SMS_SIGN)
    request.set_TemplateCode(settings.ALIYUN_SMS_TEMPLATE)
    request.set_TemplateParam(json.dumps({"code": code}))
    response = client.do_action_with_exception(request)
    result = json.loads(response)
    if result.get("Code") != "OK":
        raise Exception(f"SMS failed: {result.get('Message')}")
```

- [ ] **Step 4: 创建 middleware/auth.py**

```python
# backend/app/middleware/auth.py
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User

def create_jwt(user_id: str) -> str:
    from datetime import datetime, timedelta
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload["sub"]
    except JWTError:
        raise HTTPException(401, "无效 Token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(401, "用户不存在")
    return user
```

- [ ] **Step 5: 创建 schemas/user.py**

```python
# backend/app/schemas/user.py
from pydantic import BaseModel

class SendCodeRequest(BaseModel):
    phone: str

class LoginRequest(BaseModel):
    phone: str
    code: str

class LoginResponse(BaseModel):
    token: str
    credit_balance: int
    tier: str
```

- [ ] **Step 6: 创建 routers/auth.py**

```python
# backend/app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import redis as redis_lib

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
    code = generate_code()
    redis_client.setex(f"sms:{body.phone}", 300, code.encode())
    send_sms_code(body.phone, code)
    return {"message": "验证码已发送"}

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    stored = redis_client.get(f"sms:{body.phone}")
    if not stored or stored.decode() != body.code:
        raise HTTPException(400, "验证码错误或已过期")
    redis_client.delete(f"sms:{body.phone}")

    user = db.query(User).filter(User.phone == body.phone).first()
    if not user:
        user = User(phone=body.phone, credit_balance=3, tier="free")
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_jwt(user.id)
    return LoginResponse(token=token, credit_balance=user.credit_balance, tier=user.tier)
```

- [ ] **Step 7: 运行测试，确认通过**

```bash
cd backend && poetry run pytest app/tests/test_auth.py -v
```

Expected: 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add . && git commit -m "feat: phone/SMS auth with JWT"
```

---

## Task 4: 模板数据种子

**Files:**
- Create: `backend/app/routers/templates.py`
- Create: `backend/scripts/seed_templates.py`

- [ ] **Step 1: 创建 routers/templates.py**

```python
# backend/app/routers/templates.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.template import Template

router = APIRouter()

@router.get("/")
def list_templates(platform: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Template).filter(Template.is_active == True)
    if platform:
        q = q.filter(Template.platform == platform)
    return q.all()
```

- [ ] **Step 2: 创建 scripts/seed_templates.py**

```python
# backend/scripts/seed_templates.py
"""运行：poetry run python scripts/seed_templates.py"""
import sys; sys.path.insert(0, ".")
from app.database import SessionLocal
from app.models.template import Template

TEMPLATES = [
    {
        "name": "淘宝主图 - 简约白底",
        "platform": "taobao",
        "category": "background",
        "size": "1024x1024",
        "prompt_template": "Professional product photography of {product_description} on pure white background, studio lighting, clean shadows, e-commerce style, high resolution",
    },
    {
        "name": "拼多多主图 - 低价促销风",
        "platform": "pdd",
        "category": "style",
        "size": "1024x1024",
        "prompt_template": "Vibrant promotional product photo of {product_description}, bright colors, sale banner style, Chinese e-commerce, bold composition",
    },
    {
        "name": "抖音小店封面 - 竖版生活场景",
        "platform": "douyin",
        "category": "scene",
        "size": "1024x1280",
        "prompt_template": "Lifestyle product photo of {product_description}, modern Chinese home setting, natural lighting, social media ready, vertical format",
    },
    {
        "name": "通用 - 室内陈列场景",
        "platform": "universal",
        "category": "scene",
        "size": "1024x1024",
        "prompt_template": "Product {product_description} displayed in a modern minimalist indoor setting, soft natural light, lifestyle photography",
    },
    {
        "name": "通用 - 户外生活场景",
        "platform": "universal",
        "category": "scene",
        "size": "1024x1024",
        "prompt_template": "Product {product_description} in an outdoor lifestyle setting, natural sunlight, fresh and vibrant atmosphere",
    },
    {
        "name": "通用 - 简约文艺风",
        "platform": "universal",
        "category": "style",
        "size": "1024x1024",
        "prompt_template": "Artistic minimalist product photo of {product_description}, neutral tones, editorial style, elegant composition",
    },
    {
        "name": "通用 - 科技感背景",
        "platform": "universal",
        "category": "background",
        "size": "1024x1024",
        "prompt_template": "Futuristic tech product display of {product_description}, dark background with blue neon accents, modern digital aesthetic",
    },
    {
        "name": "通用 - 节日促销风格",
        "platform": "universal",
        "category": "style",
        "size": "1024x1024",
        "prompt_template": "Festive promotional photo of {product_description}, warm holiday colors, celebratory atmosphere, gift presentation style",
    },
    {
        "name": "通用 - 高端奢侈品风格",
        "platform": "universal",
        "category": "style",
        "size": "1024x1024",
        "prompt_template": "Luxury product photography of {product_description}, dark rich background, dramatic lighting, premium brand aesthetic",
    },
    {
        "name": "拼多多主图 - 白底通用",
        "platform": "pdd",
        "category": "background",
        "size": "1024x1024",
        "prompt_template": "Clean white background product photo of {product_description}, bright lighting, no shadows, marketplace ready",
    },
]

def seed():
    db = SessionLocal()
    for t in TEMPLATES:
        exists = db.query(Template).filter(Template.name == t["name"]).first()
        if not exists:
            db.add(Template(**t))
    db.commit()
    print(f"Seeded {len(TEMPLATES)} templates.")
    db.close()

if __name__ == "__main__":
    seed()
```

- [ ] **Step 3: 执行种子**

```bash
cd backend && poetry run python scripts/seed_templates.py
```

Expected: `Seeded 10 templates.`

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat: template data and seed script"
```

---

## Task 5: OpenAI 图片生成服务

**Files:**
- Create: `backend/app/services/openai_image.py`
- Create: `backend/app/services/prompt_builder.py`
- Create: `backend/app/tests/test_prompt_builder.py`

- [ ] **Step 1: 编写 prompt_builder 失败测试**

```python
# backend/app/tests/test_prompt_builder.py
from unittest.mock import AsyncMock, patch
import pytest

@pytest.mark.asyncio
async def test_expand_keywords_returns_english_string():
    with patch("app.services.prompt_builder.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=AsyncMock(
            choices=[AsyncMock(message=AsyncMock(content="blue minimalist women dress spring fashion"))]
        ))
        from app.services.prompt_builder import expand_keywords
        result = await expand_keywords("蓝色 简约 女装连衣裙 春季")
    assert isinstance(result, str)
    assert len(result) > 10

@pytest.mark.asyncio
async def test_expand_keywords_rejects_empty():
    from app.services.prompt_builder import expand_keywords
    with pytest.raises(ValueError):
        await expand_keywords("")
```

- [ ] **Step 2: 运行，确认失败**

```bash
cd backend && poetry run pytest app/tests/test_prompt_builder.py -v
```

Expected: FAIL - module not found

- [ ] **Step 3: 创建 services/prompt_builder.py**

```python
# backend/app/services/prompt_builder.py
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = (
    "You are an expert at writing image generation prompts for e-commerce product photography. "
    "Convert Chinese keywords into a concise, descriptive English prompt suitable for GPT-Image-2. "
    "Focus on visual style, lighting, background, and product description. "
    "Output only the prompt text, no explanations."
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
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
cd backend && poetry run pytest app/tests/test_prompt_builder.py -v
```

Expected: 2 tests PASS

- [ ] **Step 5: 创建 services/openai_image.py**

```python
# backend/app/services/openai_image.py
"""
GPT-Image-2 API（模型名 gpt-image-1）调用封装。
返回 (image_bytes, output_tokens)，output_tokens 用于账单监控。
注意：token 计费受尺寸/质量/输入图影响，需结合实际账单持续校准。
"""
import base64
import io
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def generate_from_text(prompt: str, size: str = "1024x1024") -> tuple[bytes, int]:
    """纯文本生成。返回 (图片字节, output_tokens)。"""
    response = await client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size=size,
        quality="medium",
        n=1,
        output_format="png",
    )
    image_bytes = base64.b64decode(response.data[0].b64_json)
    tokens = response.usage.output_tokens if response.usage else 0
    return image_bytes, tokens

async def generate_from_reference(
    prompt: str,
    reference_bytes: bytes,
    size: str = "1024x1024",
) -> tuple[bytes, int]:
    """以参考图为基础生成。返回 (图片字节, output_tokens)。"""
    img_file = io.BytesIO(reference_bytes)
    img_file.name = "reference.png"
    response = await client.images.edit(
        model="gpt-image-1",
        image=img_file,
        prompt=prompt,
        size=size,
        n=1,
        output_format="png",
    )
    image_bytes = base64.b64decode(response.data[0].b64_json)
    tokens = response.usage.output_tokens if response.usage else 0
    return image_bytes, tokens
```

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: openai image service and prompt builder"
```

---

## Task 6: 积分预估器

**Files:**
- Create: `backend/app/services/credit_estimator.py`
- Create: `backend/app/tests/test_credit_estimator.py`

- [ ] **Step 1: 编写失败测试**

```python
# backend/app/tests/test_credit_estimator.py
from app.services.credit_estimator import estimate_credits

def test_text_only_costs_1_credit():
    cost = estimate_credits(has_reference_image=False)
    assert cost == 1

def test_with_reference_image_costs_2_credits():
    cost = estimate_credits(has_reference_image=True)
    assert cost == 2

def test_large_size_costs_more():
    small = estimate_credits(has_reference_image=False, size="1024x1024")
    large = estimate_credits(has_reference_image=False, size="1024x1280")
    assert large >= small
```

- [ ] **Step 2: 运行，确认失败**

```bash
cd backend && poetry run pytest app/tests/test_credit_estimator.py -v
```

Expected: FAIL

- [ ] **Step 3: 创建 services/credit_estimator.py**

```python
# backend/app/services/credit_estimator.py
"""
积分预估：基于保守估算，上线后需对比实际 OpenAI 账单持续调整。
当前策略：
- 基础文本生成 = 1 积分
- 含参考图（image edit）= 2 积分（输入 token 更多）
- 竖版大图（1024x1280）= 额外 +1 积分
"""

LARGE_SIZES = {"1024x1280", "1280x1024"}

def estimate_credits(has_reference_image: bool, size: str = "1024x1024") -> int:
    base = 2 if has_reference_image else 1
    if size in LARGE_SIZES:
        base += 1
    return base
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
cd backend && poetry run pytest app/tests/test_credit_estimator.py -v
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: credit estimator with conservative pricing"
```

---

## Task 7: Cloudflare R2 存储服务

**Files:**
- Create: `backend/app/services/storage.py`

- [ ] **Step 1: 创建 services/storage.py**

```python
# backend/app/services/storage.py
import uuid
import boto3
from botocore.config import Config
from app.config import settings

s3 = boto3.client(
    "s3",
    endpoint_url=settings.R2_ENDPOINT,
    aws_access_key_id=settings.R2_ACCESS_KEY,
    aws_secret_access_key=settings.R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

def upload_image(image_bytes: bytes, user_id: str) -> str:
    """上传图片到 R2，返回公开访问 URL。"""
    key = f"generations/{user_id}/{uuid.uuid4()}.png"
    s3.put_object(
        Bucket=settings.R2_BUCKET,
        Key=key,
        Body=image_bytes,
        ContentType="image/png",
    )
    return f"{settings.R2_PUBLIC_URL}/{key}"
```

- [ ] **Step 2: 手动测试上传（需填好 .env）**

```python
# 在 backend/ 目录下临时运行
import sys; sys.path.insert(0, ".")
from app.services.storage import upload_image
url = upload_image(b"fake-image-bytes", "test-user")
print(url)
```

Expected: 输出完整 URL，且浏览器可访问（需先配置 R2 Bucket 公开策略）

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: cloudflare R2 storage service"
```

---

## Task 8: 图片生成 API 端点（3 种模式）

**Files:**
- Create: `backend/app/schemas/generation.py`
- Create: `backend/app/routers/generations.py`
- Create: `backend/app/tests/test_generation.py`

- [ ] **Step 1: 创建 schemas/generation.py**

```python
# backend/app/schemas/generation.py
from pydantic import BaseModel
from typing import Optional

class EstimateRequest(BaseModel):
    mode: str              # template | keyword | custom
    template_id: Optional[str] = None
    has_reference_image: bool = False
    size: str = "1024x1024"

class EstimateResponse(BaseModel):
    credits_required: int

class GenerateResponse(BaseModel):
    id: str
    image_url: str
    credits_used: int
    credits_remaining: int
```

- [ ] **Step 2: 编写生成端点失败测试**

```python
# backend/app/tests/test_generation.py
from unittest.mock import patch, AsyncMock

def test_estimate_returns_credits(client):
    # 先登录拿 token
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"111111"
        login = client.post("/api/auth/login", json={"phone": "13900139000", "code": "111111"})
    token = login.json()["token"]

    resp = client.post(
        "/api/generate/estimate",
        json={"mode": "keyword", "has_reference_image": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["credits_required"] == 1

def test_generate_deducts_credits(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"222222"
        login = client.post("/api/auth/login", json={"phone": "13900139001", "code": "222222"})
    token = login.json()["token"]

    with patch("app.routers.generations.expand_keywords", new_callable=AsyncMock) as mock_expand, \
         patch("app.routers.generations.generate_from_text", new_callable=AsyncMock) as mock_gen, \
         patch("app.routers.generations.upload_image") as mock_upload:
        mock_expand.return_value = "blue dress spring fashion"
        mock_gen.return_value = (b"fake_png", 1000)
        mock_upload.return_value = "https://images.example.com/test.png"

        resp = client.post(
            "/api/generate/keyword",
            data={"keywords": "蓝色连衣裙"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["credits_remaining"] == 2  # 新用户 3 张，消耗 1 张
    assert "image_url" in data
```

- [ ] **Step 3: 运行，确认失败**

```bash
cd backend && poetry run pytest app/tests/test_generation.py -v
```

Expected: FAIL

- [ ] **Step 4: 创建 routers/generations.py**

```python
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

def _deduct_and_save(
    db: Session, user: User, mode: str, prompt: str,
    image_url: str, credits: int, tokens: int,
    template_id: str | None = None,
) -> Generation:
    user.credit_balance -= credits
    gen = Generation(
        user_id=user.id, mode=mode, prompt=prompt, template_id=template_id,
        image_url=image_url, credits_used=credits, tokens_used=tokens,
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
        raise HTTPException(402, "积分不足，请充值")

    prompt = await expand_keywords(keywords)
    if ref_bytes:
        image_bytes, tokens = await generate_from_reference(prompt, ref_bytes)
    else:
        image_bytes, tokens = await generate_from_text(prompt)

    url = upload_image(image_bytes, current_user.id)
    gen = _deduct_and_save(db, current_user, "keyword", prompt, url, credits, tokens)
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
        raise HTTPException(404, "模板不存在")

    ref_bytes = await reference_image.read() if reference_image else None
    credits = estimate_credits(has_reference_image=bool(ref_bytes), size=template.size)
    if current_user.credit_balance < credits:
        raise HTTPException(402, "积分不足，请充值")

    prompt = template.prompt_template.replace("{product_description}", product_description)
    if ref_bytes:
        image_bytes, tokens = await generate_from_reference(prompt, ref_bytes, template.size)
    else:
        image_bytes, tokens = await generate_from_text(prompt, template.size)

    url = upload_image(image_bytes, current_user.id)
    gen = _deduct_and_save(db, current_user, "template", prompt, url, credits, tokens, template_id)
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
        raise HTTPException(402, "积分不足，请充值")

    if ref_bytes:
        image_bytes, tokens = await generate_from_reference(prompt, ref_bytes)
    else:
        image_bytes, tokens = await generate_from_text(prompt)

    url = upload_image(image_bytes, current_user.id)
    gen = _deduct_and_save(db, current_user, "custom", prompt, url, credits, tokens)
    return GenerateResponse(id=gen.id, image_url=url, credits_used=credits, credits_remaining=current_user.credit_balance)
```

- [ ] **Step 5: 创建 middleware/rate_limit.py**

```python
# backend/app/middleware/rate_limit.py
from datetime import datetime, date
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.generation import Generation
from app.models.user import User
from app.config import settings

def check_daily_limit(user: User, db: Session) -> None:
    if user.tier == "paid":
        return  # 付费用户不限制
    today_start = datetime.combine(date.today(), datetime.min.time())
    count = (
        db.query(Generation)
        .filter(
            Generation.user_id == user.id,
            Generation.status == "success",
            Generation.created_at >= today_start,
        )
        .count()
    )
    if count >= settings.MAX_DAILY_FREE_GENERATIONS:
        raise HTTPException(429, f"免费用户每日限{settings.MAX_DAILY_FREE_GENERATIONS}次，请充值升级")
```

- [ ] **Step 6: 运行测试，确认通过**

```bash
cd backend && poetry run pytest app/tests/test_generation.py -v
```

Expected: 2 tests PASS

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "feat: generation endpoints (template/keyword/custom) with credit deduction"
```

---

## Task 9: 积分 & 支付（虎皮椒）

**Files:**
- Create: `backend/app/services/payment.py`
- Create: `backend/app/schemas/credit.py`
- Create: `backend/app/routers/credits.py`

- [ ] **Step 1: 创建 schemas/credit.py**

```python
# backend/app/schemas/credit.py
from pydantic import BaseModel
from decimal import Decimal

class PackageInfo(BaseModel):
    id: str
    name: str
    price_cny: float
    credits: int
    description: str

class CreateOrderRequest(BaseModel):
    package_id: str

class CreateOrderResponse(BaseModel):
    order_id: str
    pay_url: str
    amount_cny: float
    credits: int
```

- [ ] **Step 2: 创建 services/payment.py**

```python
# backend/app/services/payment.py
"""
虎皮椒支付集成。
使用前核实：业务类型是否允许、单日限额、费率、退款流程、风控规则。
文档：https://www.xunhupay.com/doc/
"""
import hashlib
import time
import httpx
from app.config import settings

PACKAGES = {
    "trial": {"name": "体验包", "price_cny": 9.90, "credits": 6},
    "standard": {"name": "标准包", "price_cny": 39.00, "credits": 30},
    "pro": {"name": "专业包", "price_cny": 99.00, "credits": 100},
    "shop": {"name": "店铺包", "price_cny": 299.00, "credits": 350},
}

def get_package(package_id: str) -> dict:
    if package_id not in PACKAGES:
        raise ValueError(f"Unknown package: {package_id}")
    return {"id": package_id, **PACKAGES[package_id]}

def _sign(params: dict) -> str:
    """虎皮椒签名算法：字母序拼接 key=value，附加 secret，MD5。"""
    sorted_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()) if v)
    raw = sorted_str + settings.HUPIJIAO_SECRET
    return hashlib.md5(raw.encode()).hexdigest()

async def create_payment_order(
    order_id: str, package_id: str, notify_url: str, return_url: str
) -> str:
    """创建虎皮椒订单，返回支付跳转 URL。"""
    pkg = get_package(package_id)
    params = {
        "appid": settings.HUPIJIAO_KEY,
        "trade_order_id": order_id,
        "total_fee": str(pkg["price_cny"]),
        "title": f"AI商品图积分 - {pkg['name']}",
        "notify_url": notify_url,
        "return_url": return_url,
        "time": str(int(time.time())),
        "nonce_str": order_id[:16],
    }
    params["hash"] = _sign(params)
    async with httpx.AsyncClient() as http:
        resp = await http.post("https://api.xunhupay.com/payment/do.html", data=params)
    data = resp.json()
    if data.get("errcode") != 0:
        raise Exception(f"Payment error: {data.get('errmsg')}")
    return data["url"]

def verify_webhook(params: dict) -> bool:
    """验证虎皮椒回调签名。"""
    received_hash = params.pop("hash", "")
    expected = _sign(params)
    return received_hash == expected
```

- [ ] **Step 3: 创建 routers/credits.py**

```python
# backend/app/routers/credits.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.credit_order import CreditOrder
from app.schemas.credit import PackageInfo, CreateOrderRequest, CreateOrderResponse
from app.services.payment import PACKAGES, get_package, create_payment_order, verify_webhook
from datetime import datetime
import uuid

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
    pkg = get_package(body.package_id)
    order_id = str(uuid.uuid4())
    base_url = str(request.base_url).rstrip("/")
    notify_url = f"{base_url}/api/credits/webhook"
    return_url = f"{base_url.replace(':8000', ':3000')}/credits?status=success"

    pay_url = await create_payment_order(order_id, body.package_id, notify_url, return_url)
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
        order_id=order_id, pay_url=pay_url,
        amount_cny=pkg["price_cny"], credits=pkg["credits"],
    )

@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """虎皮椒支付回调。"""
    form = dict(await request.form())
    if not verify_webhook(dict(form)):
        return {"errcode": 1, "errmsg": "签名错误"}

    order_id = form.get("trade_order_id")
    order = db.get(CreditOrder, order_id)
    if not order or order.status == "paid":
        return {"errcode": 0, "errmsg": "ok"}

    order.status = "paid"
    order.payment_channel = form.get("channel", "")
    order.external_order_id = form.get("transaction_id", "")
    order.paid_at = datetime.utcnow()

    user = db.get(User, order.user_id)
    user.credit_balance += order.credits
    if user.tier == "free":
        user.tier = "paid"

    db.commit()
    return {"errcode": 0, "errmsg": "ok"}
```

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat: credit packages, order creation, and hupijiao webhook"
```

---

## Task 10: 生成历史 & 定时清理

**Files:**
- Create: `backend/app/routers/history.py`
- Create: `backend/scripts/cleanup_expired.py`

- [ ] **Step 1: 创建 routers/history.py**

```python
# backend/app/routers/history.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.generation import Generation
from app.models.user import User

router = APIRouter()

@router.get("/")
def list_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * page_size
    now = datetime.utcnow()
    rows = (
        db.query(Generation)
        .filter(
            Generation.user_id == current_user.id,
            Generation.status == "success",
            Generation.expires_at > now,
        )
        .order_by(Generation.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return {"items": [{"id": r.id, "image_url": r.image_url, "mode": r.mode, "created_at": r.created_at} for r in rows]}
```

- [ ] **Step 2: 创建 scripts/cleanup_expired.py（计划任务，每日运行）**

```python
# backend/scripts/cleanup_expired.py
"""
删除过期图片记录，同时从 R2 删除对应文件。
建议：在 AWS 上用 cron 每日凌晨 3 点执行。
运行：poetry run python scripts/cleanup_expired.py
"""
import sys; sys.path.insert(0, ".")
from datetime import datetime
from app.database import SessionLocal
from app.models.generation import Generation
from app.services.storage import s3
from app.config import settings

def cleanup():
    db = SessionLocal()
    now = datetime.utcnow()
    expired = db.query(Generation).filter(Generation.expires_at <= now, Generation.image_url != None).all()
    count = 0
    for gen in expired:
        try:
            # 从 URL 中提取 R2 key
            key = gen.image_url.replace(settings.R2_PUBLIC_URL + "/", "")
            s3.delete_object(Bucket=settings.R2_BUCKET, Key=key)
        except Exception as e:
            print(f"R2 delete failed for {gen.id}: {e}")
        gen.image_url = None
        gen.status = "expired"
        count += 1
    db.commit()
    print(f"Cleaned up {count} expired generations.")
    db.close()

if __name__ == "__main__":
    cleanup()
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: generation history endpoint and expiry cleanup script"
```

---

## Task 11: Next.js 前端脚手架

**Files:**
- Create: `frontend/` (整个前端项目)
- Create: `frontend/lib/api.ts`
- Create: `frontend/lib/auth.ts`

- [ ] **Step 1: 初始化 Next.js 项目**

```bash
cd project
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend
```

- [ ] **Step 2: 安装额外依赖**

```bash
npm install axios zustand react-hot-toast
```

- [ ] **Step 3: 创建 lib/api.ts**

```typescript
// frontend/lib/api.ts
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: `${BASE_URL}/api` });

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
```

- [ ] **Step 4: 创建 lib/auth.ts**

```typescript
// frontend/lib/auth.ts
import { create } from "zustand";

interface AuthState {
  token: string | null;
  creditBalance: number;
  tier: string;
  setAuth: (token: string, creditBalance: number, tier: string) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  creditBalance: 0,
  tier: "free",
  setAuth: (token, creditBalance, tier) => {
    localStorage.setItem("token", token);
    set({ token, creditBalance, tier });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, creditBalance: 0, tier: "free" });
  },
  updateBalance: (balance) => set({ creditBalance: balance }),
}));
```

- [ ] **Step 5: 创建 .env.local**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 6: 验证前端启动**

```bash
cd frontend && npm run dev
```

Expected: `http://localhost:3000` 正常加载

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "feat: nextjs frontend scaffold with api client and auth store"
```

---

## Task 12: 登录页面

**Files:**
- Create: `frontend/app/login/page.tsx`

- [ ] **Step 1: 创建 app/login/page.tsx**

```tsx
// frontend/app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const router = useRouter();

  async function handleSendCode() {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error("请输入正确的手机号");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/send-code", { phone });
      setCodeSent(true);
      toast.success("验证码已发送");
    } catch {
      toast.error("发送失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { phone, code });
      setAuth(data.token, data.credit_balance, data.tier);
      router.push("/dashboard");
    } catch {
      toast.error("验证码错误或已过期");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">登录 / 注册</h1>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendCode}
              disabled={loading || codeSent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 whitespace-nowrap"
            >
              {codeSent ? "已发送" : "发送验证码"}
            </button>
          </div>
          {codeSent && (
            <input
              type="text"
              placeholder="6 位验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {codeSent && (
            <button
              onClick={handleLogin}
              disabled={loading || code.length !== 6}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录 / 注册"}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          登录即表示同意
          <a href="/legal/terms" className="underline mx-1">服务条款</a>和
          <a href="/legal/privacy" className="underline mx-1">隐私政策</a>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 在 app/layout.tsx 中添加 Toaster**

```tsx
// 在 app/layout.tsx 的 <body> 内最后一行添加：
import { Toaster } from "react-hot-toast";
// ...
<Toaster position="top-center" />
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: login page with phone/SMS auth"
```

---

## Task 13: Dashboard（核心生成界面）

**Files:**
- Create: `frontend/app/dashboard/page.tsx`
- Create: `frontend/components/TemplateSelector.tsx`
- Create: `frontend/components/CreditEstimate.tsx`
- Create: `frontend/components/ImageResult.tsx`

- [ ] **Step 1: 创建 components/TemplateSelector.tsx**

```tsx
// frontend/components/TemplateSelector.tsx
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  platform: string;
  category: string;
  thumbnail_url: string | null;
}

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
  platform?: string;
}

export default function TemplateSelector({ selected, onSelect, platform }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    api.get("/templates/", { params: platform ? { platform } : {} })
      .then((r) => setTemplates(r.data));
  }, [platform]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`border rounded-lg p-3 text-left text-sm transition ${
            selected === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <div className="font-medium truncate">{t.name}</div>
          <div className="text-gray-400 text-xs mt-1">{t.platform}</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 创建 components/CreditEstimate.tsx**

```tsx
// frontend/components/CreditEstimate.tsx
interface Props {
  creditsRequired: number;
  creditsBalance: number;
}

export default function CreditEstimate({ creditsRequired, creditsBalance }: Props) {
  const sufficient = creditsBalance >= creditsRequired;
  return (
    <div className={`rounded-lg px-4 py-2 text-sm flex justify-between items-center ${
      sufficient ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
    }`}>
      <span>预计消耗 <strong>{creditsRequired}</strong> 张积分</span>
      <span>余额 {creditsBalance} 张 {!sufficient && "— 积分不足"}</span>
    </div>
  );
}
```

- [ ] **Step 3: 创建 components/ImageResult.tsx**

```tsx
// frontend/components/ImageResult.tsx
interface Props {
  imageUrl: string;
  onReset: () => void;
}

export default function ImageResult({ imageUrl, onReset }: Props) {
  return (
    <div className="mt-6 text-center">
      <img src={imageUrl} alt="生成结果" className="rounded-xl max-w-full mx-auto shadow-lg" />
      <div className="flex gap-3 justify-center mt-4">
        <a
          href={imageUrl}
          download="ai-product-image.png"
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          下载图片
        </a>
        <button
          onClick={onReset}
          className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          重新生成
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 app/dashboard/page.tsx**

```tsx
// frontend/app/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import TemplateSelector from "@/components/TemplateSelector";
import CreditEstimate from "@/components/CreditEstimate";
import ImageResult from "@/components/ImageResult";
import toast from "react-hot-toast";

type Mode = "template" | "keyword" | "custom";

export default function Dashboard() {
  const { token, creditBalance, updateBalance } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [creditsRequired, setCreditsRequired] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  useEffect(() => {
    api.post("/generate/estimate", { mode, has_reference_image: !!referenceFile })
      .then((r) => setCreditsRequired(r.data.credits_required))
      .catch(() => {});
  }, [mode, referenceFile]);

  async function handleGenerate() {
    if (creditBalance < creditsRequired) {
      toast.error("积分不足，请前往充值");
      router.push("/credits");
      return;
    }
    setLoading(true);
    setResultUrl(null);
    try {
      const form = new FormData();
      if (referenceFile) form.append("reference_image", referenceFile);

      let endpoint = "";
      if (mode === "keyword") {
        form.append("keywords", keywords);
        endpoint = "/generate/keyword";
      } else if (mode === "template") {
        if (!selectedTemplate) { toast.error("请选择模板"); return; }
        form.append("product_description", productDesc);
        endpoint = `/generate/template/${selectedTemplate}`;
      } else {
        form.append("prompt", customPrompt);
        endpoint = "/generate/custom";
      }

      const { data } = await api.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultUrl(data.image_url);
      updateBalance(data.credits_remaining);
      toast.success("生成成功！");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI 商品图生成</h1>
        <div className="text-sm text-gray-500">
          积分余额：<strong className="text-blue-600">{creditBalance}</strong> 张
          <a href="/credits" className="ml-2 text-blue-500 underline">充值</a>
        </div>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-6">
        {(["template", "keyword", "custom"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResultUrl(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === m ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {{ template: "场景模板", keyword: "关键词", custom: "自定义 Prompt" }[m]}
          </button>
        ))}
      </div>

      {/* 模式内容 */}
      {mode === "template" && (
        <div className="space-y-4">
          <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
          <input
            placeholder="商品描述（如：蓝色真丝连衣裙）"
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}
      {mode === "keyword" && (
        <input
          placeholder="输入中文关键词，如：蓝色 简约 女装连衣裙 春季"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      )}
      {mode === "custom" && (
        <textarea
          placeholder="输入英文 Prompt..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={4}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      )}

      {/* 参考图上传 */}
      <div className="mt-4">
        <label className="text-sm text-gray-600 block mb-1">上传商品参考图（可选，消耗积分+1）</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
      </div>

      {/* 积分预估 */}
      <div className="mt-4">
        <CreditEstimate creditsRequired={creditsRequired} creditsBalance={creditBalance} />
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={loading || creditBalance < creditsRequired}
        className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 text-sm"
      >
        {loading ? "生成中，约需 15-30 秒..." : "立即生成"}
      </button>

      {resultUrl && <ImageResult imageUrl={resultUrl} onReset={() => setResultUrl(null)} />}
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: dashboard generation UI with all 3 modes"
```

---

## Task 14: 历史记录 & 积分充值页面

**Files:**
- Create: `frontend/app/history/page.tsx`
- Create: `frontend/app/credits/page.tsx`

- [ ] **Step 1: 创建 app/history/page.tsx**

```tsx
// frontend/app/history/page.tsx
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Item { id: string; image_url: string; mode: string; created_at: string; }

export default function HistoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get("/history/", { params: { page } })
      .then((r) => setItems(r.data.items));
  }, [page]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">生成历史</h1>
      {items.length === 0 && <p className="text-gray-400 text-center py-20">暂无生成记录</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded-xl overflow-hidden">
            <img src={item.image_url} alt="" className="w-full aspect-square object-cover" />
            <div className="p-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">{item.mode}</span>
              <a
                href={item.image_url}
                download
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-500 underline"
              >
                下载
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center mt-8">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40">上一页</button>
        <button onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 border rounded-lg text-sm">下一页</button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 创建 app/credits/page.tsx**

```tsx
// frontend/app/credits/page.tsx
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import toast from "react-hot-toast";

interface Package { id: string; name: string; price_cny: number; credits: number; description: string; }

export default function CreditsPage() {
  const { creditBalance, tier } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.get("/credits/packages").then((r) => setPackages(r.data));
  }, []);

  async function handleBuy(packageId: string) {
    setLoading(packageId);
    try {
      const { data } = await api.post("/credits/create-order", { package_id: packageId });
      window.location.href = data.pay_url;
    } catch {
      toast.error("创建订单失败，请重试");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">积分充值</h1>
      <p className="text-gray-500 text-sm mb-6">
        当前余额：<strong className="text-blue-600">{creditBalance}</strong> 张 · {tier === "paid" ? "付费用户" : "免费用户"}
      </p>
      <div className="grid gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{pkg.name}</div>
              <div className="text-sm text-gray-500">{pkg.credits} 张图片 · ¥{pkg.price_cny}</div>
            </div>
            <button
              onClick={() => handleBuy(pkg.id)}
              disabled={loading === pkg.id}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading === pkg.id ? "跳转中..." : "立即购买"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-6 text-center">
        支持微信支付 · 支付宝 · 安全加密
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: history and credits pages"
```

---

## Task 15: 法律合规页面（5 个，上线前必须完成）

**Files:**
- Create: `frontend/app/legal/terms/page.tsx`
- Create: `frontend/app/legal/privacy/page.tsx`
- Create: `frontend/app/legal/refund/page.tsx`
- Create: `frontend/app/legal/disclaimer/page.tsx`
- Create: `frontend/app/legal/authorization/page.tsx`

- [ ] **Step 1: 创建共享布局组件（内联在每个文件中）**

每个法律页面用相同的壳：

```tsx
// 每个法律页面的结构模板
export default function XxxPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12 prose prose-gray">
      <h1>页面标题</h1>
      {/* 内容 */}
    </main>
  );
}
```

- [ ] **Step 2: 创建 app/legal/terms/page.tsx（服务条款）**

```tsx
// frontend/app/legal/terms/page.tsx
export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">服务条款</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>最后更新：2026年5月20日</p>
        <h2 className="font-semibold">1. 服务说明</h2>
        <p>本平台（以下简称"平台"）提供基于 AI 技术的商品图片生成服务。用户注册并购买积分后，可使用积分生成商品图片。</p>
        <h2 className="font-semibold">2. 用户责任</h2>
        <p>用户须对其上传的所有素材拥有合法使用权。禁止上传侵权图片、明星肖像、品牌 LOGO 等受版权保护的内容。用户对最终生成图片的商业使用负完全责任。</p>
        <h2 className="font-semibold">3. 积分与付款</h2>
        <p>积分购买后不退款（法律规定情形除外）。平台有权根据运营成本调整积分价格，调整前会提前通知用户。</p>
        <h2 className="font-semibold">4. 服务中断</h2>
        <p>平台不保证服务永久可用，因第三方 API 故障、维护等原因造成的服务中断，平台将尽力恢复，但不承担经济损失赔偿。</p>
        <h2 className="font-semibold">5. 争议解决</h2>
        <p>本条款受中华人民共和国法律管辖。</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 创建 app/legal/privacy/page.tsx（隐私政策）**

```tsx
// frontend/app/legal/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">隐私政策</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>最后更新：2026年5月20日</p>
        <h2 className="font-semibold">1. 收集的信息</h2>
        <p>我们收集：手机号码（用于登录验证）、生成记录（图片 URL、使用的提示词）、支付信息（由第三方支付平台处理，我们不存储银行卡信息）。</p>
        <h2 className="font-semibold">2. 信息使用</h2>
        <p>收集的信息仅用于提供服务、改善产品体验、处理支付和客服纠纷。我们不会向第三方出售您的个人信息。</p>
        <h2 className="font-semibold">3. 数据存储</h2>
        <p>生成图片免费用户保存 7 天，付费用户保存 30 天，到期自动删除。</p>
        <h2 className="font-semibold">4. 联系我们</h2>
        <p>如有隐私问题，请发邮件至：privacy@yourdomain.com</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: 创建 app/legal/refund/page.tsx（退款规则）**

```tsx
// frontend/app/legal/refund/page.tsx
export default function RefundPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">退款规则</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="font-semibold">不予退款的情形</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>积分已被全部或部分使用</li>
          <li>因用户提供的素材不符合要求导致生成失败</li>
          <li>因用户违反服务条款被封号</li>
        </ul>
        <h2 className="font-semibold">可申请退款的情形</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>购买后 24 小时内，积分未使用，可申请全额退款</li>
          <li>因平台系统故障导致积分错误扣除，经核实后退还</li>
        </ul>
        <h2 className="font-semibold">申请方式</h2>
        <p>联系客服邮箱：support@yourdomain.com，注明订单号和退款原因，我们将在 3 个工作日内处理。</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: 创建 app/legal/disclaimer/page.tsx（AI 生成内容免责声明）**

```tsx
// frontend/app/legal/disclaimer/page.tsx
export default function DisclaimerPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">AI 生成内容免责声明</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>使用本平台前，请仔细阅读以下声明：</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>平台使用 AI 技术生成图片，生成结果具有随机性，平台不保证每次生成结果均满足用户期望。</li>
          <li>生成图片仅供设计辅助参考，用户在将图片用于商业用途（如电商上架）前，须自行审核图片内容的合法性与准确性。</li>
          <li>平台不承诺生成图片能提升点击率、转化率或销量。</li>
          <li>严禁使用平台生成：虚假宣传图片、夸大功效的医疗/保健品图、仿冒品牌形象、侵犯他人肖像权的图片。</li>
          <li>不同用户使用相同提示词可能得到相似输出（AI 特性）。用户不对生成图片主张独家版权。</li>
          <li>因用户违规使用生成图片导致的法律责任，由用户自行承担。</li>
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: 创建 app/legal/authorization/page.tsx（用户上传素材授权说明）**

```tsx
// frontend/app/legal/authorization/page.tsx
export default function AuthorizationPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">用户上传素材授权说明</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>当您向本平台上传图片素材时，即表示您声明并保证：</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>您拥有该图片的合法使用权，或已获得版权所有者的授权。</li>
          <li>该图片不包含他人肖像（除非您已获得肖像权人书面授权）。</li>
          <li>该图片不涉及侵权品牌 LOGO、注册商标或其他受法律保护的标识。</li>
          <li>您授权本平台将上传素材用于 AI 图片生成处理，处理完成后原始素材不会被长期存储或用于其他用途。</li>
        </ul>
        <p>如因上传内容违规导致第三方投诉或法律纠纷，由用户自行承担全部责任。</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "feat: all 5 required legal pages before launch"
```

---

## Task 16: 落地页

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: 更新 app/page.tsx**

```tsx
// frontend/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
          商品图不用拍<br />
          <span className="text-blue-600">AI 一键生成，直接上架</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          面向淘宝 · 拼多多 · 抖音小店卖家<br />
          省拍摄 · 省修图 · 批量生成 · 低成本测图
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition"
        >
          免费试用 3 张 →
        </Link>
      </section>

      {/* 核心卖点 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 grid sm:grid-cols-3 gap-8 text-center">
          {[
            { title: "省拍摄成本", desc: "一张白底图，生成 10 种场景图" },
            { title: "提速上新", desc: "批量处理 SKU，1 小时顶一天" },
            { title: "低成本测图", desc: "多版主图对比，找出高点击率" },
          ].map((item) => (
            <div key={item.title}>
              <div className="text-xl font-bold mb-2">{item.title}</div>
              <div className="text-gray-500 text-sm">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-400 space-x-4">
        <Link href="/legal/terms">服务条款</Link>
        <Link href="/legal/privacy">隐私政策</Link>
        <Link href="/legal/refund">退款规则</Link>
        <Link href="/legal/disclaimer">免责声明</Link>
        <Link href="/legal/authorization">素材授权</Link>
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat: landing page with value props and legal footer links"
```

---

## Task 17: 部署配置

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/.env.production`

- [ ] **Step 1: 创建 backend/Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN pip install poetry
COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-root --only main
COPY app/ ./app/
EXPOSE 8000
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: 部署后端到 AWS 新加坡（EC2 t3.small）**

```bash
# 在服务器上
git clone <your-repo> && cd project/backend
cp .env.example .env && vim .env  # 填入生产环境变量
docker build -t ai-image-backend .
docker run -d --env-file .env -p 8000:8000 --name backend ai-image-backend
# 配置 Nginx 反向代理 + HTTPS（Let's Encrypt）
```

- [ ] **Step 3: 部署前端到 Vercel**

```bash
cd frontend
# 在 Vercel Dashboard 中设置环境变量：
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
vercel --prod
```

- [ ] **Step 4: 运行数据库 migration（生产环境）**

```bash
cd backend
poetry run alembic upgrade head
poetry run python scripts/seed_templates.py
```

- [ ] **Step 5: 设置定时清理任务（AWS EC2 crontab）**

```bash
# 每日凌晨 3 点清理过期图片
crontab -e
# 添加：
0 3 * * * cd /app && poetry run python scripts/cleanup_expired.py >> /var/log/cleanup.log 2>&1
```

- [ ] **Step 6: 上线前检查清单**

```
[ ] 所有 5 个法律页面可以正常访问
[ ] 手机号登录正常（真实短信）
[ ] 模板生成、关键词生成、自定义 Prompt 三种模式都能成功出图
[ ] 积分扣减正确，失败退还
[ ] 虎皮椒支付回调在生产环境正常（需用真实 HTTPS URL）
[ ] 每日限额对免费用户生效
[ ] R2 图片可以公开访问
[ ] CORS 配置正确（只允许你的域名）
[ ] OpenAI API 账单告警已设置（防止超支）
```

- [ ] **Step 7: Final commit**

```bash
git add . && git commit -m "feat: production deployment config and launch checklist"
```

---

## 自检：Spec 覆盖确认

| 设计文档要求 | 覆盖任务 |
|-------------|---------|
| 三种生成入口（模板/关键词/自定义） | Task 8, 13 |
| 积分预估（生成前显示消耗） | Task 6, 8, 13 |
| 每日免费次数限制 | Task 8（rate_limit.py） |
| 手机号 + SMS 登录 | Task 3, 12 |
| Cloudflare R2 图片存储 | Task 7 |
| 虎皮椒支付 + Webhook | Task 9, 14 |
| 免费7天/付费30天历史 | Task 8（_expires_at）, 10 |
| 过期图片自动清理 | Task 10 |
| 10 个模板 seed 数据 | Task 4 |
| 5 个法律合规页面 | Task 15 |
| 落地页 | Task 16 |
| 部署配置 | Task 17 |
| OpenAI API 账单监控 | Task 17 checklist |
