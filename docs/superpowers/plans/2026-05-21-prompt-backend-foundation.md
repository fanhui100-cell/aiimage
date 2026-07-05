# Prompt 后端基础 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Prompt 目录建立完整的后端 DB + API：prompts / prompt_stats / prompt_favorites 三张表，含搜索、浏览/复制计数、收藏 API，并把前端的 11 条静态 prompt 数据 seed 到 DB。

**Architecture:** 沿用现有 FastAPI + SQLAlchemy 2.0 (Column 语法) + PostgreSQL 模式。新增 3 个 model、1 个 Alembic migration、1 个 router（`/api/prompts/`）、1 个 seed 脚本。所有外键关联到现有 `users` 表。

**Tech Stack:** Python 3.13 · FastAPI · SQLAlchemy (Column syntax) · PostgreSQL · Alembic · pytest + SQLite StaticPool

---

## 文件结构

```
backend/app/models/prompt.py          ← 新建：Prompt, PromptFavorite, PromptStat
backend/app/models/__init__.py        ← 修改：加入新 model import
backend/alembic/versions/<hash>_prompt_tables.py  ← 新建：migration
backend/app/schemas/prompt.py         ← 新建：Pydantic schemas
backend/app/routers/prompts.py        ← 新建：API router
backend/app/main.py                   ← 修改：注册 router
backend/scripts/seed_prompts.py       ← 新建：seed 11 条 prompt
backend/app/tests/test_prompts.py     ← 新建：API 测试
```

---

### Task 1: Prompt 数据模型

**Files:**
- Create: `backend/app/models/prompt.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: 创建 prompt.py**

```python
# backend/app/models/prompt.py
import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    model_name = Column(String(50), nullable=False, index=True)   # GPT-Image-2 / Nano Banana / Midjourney / Video
    category = Column(String(50), nullable=False, index=True)     # 电商商品图 / 海报排版 …
    scenario = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    prompt_zh = Column(Text, nullable=False)
    prompt_en = Column(Text, nullable=False)
    tags = Column(JSONB, nullable=False, server_default="'[]'::jsonb")
    variables = Column(JSONB, nullable=False, server_default="'[]'::jsonb")
    usage_tips = Column(JSONB, nullable=False, server_default="'[]'::jsonb")
    difficulty = Column(String(10), nullable=False)               # 入门 / 进阶 / 专业
    platform = Column(String(100), nullable=False)
    output_type = Column(String(50), nullable=False)
    aspect_ratio = Column(String(20), nullable=False)
    visual = Column(String(30), nullable=False, server_default="'product'")
    example_image_url = Column(String(500), nullable=True)        # 真实效果图 URL
    is_premium = Column(Boolean, nullable=False, server_default="false")
    author = Column(String(100), nullable=False, server_default="'Prompt123 编辑部'")
    popularity = Column(Integer, nullable=False, server_default="0")
    updated_at = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PromptFavorite(Base):
    __tablename__ = "prompt_favorites"
    __table_args__ = (UniqueConstraint("user_id", "prompt_id", name="uq_user_prompt_favorite"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PromptStat(Base):
    __tablename__ = "prompt_stats"

    prompt_id = Column(String(36), ForeignKey("prompts.id"), primary_key=True)
    view_count = Column(Integer, nullable=False, server_default="0")
    copy_count = Column(Integer, nullable=False, server_default="0")
    favorite_count = Column(Integer, nullable=False, server_default="0")
```

- [ ] **Step 2: 更新 models/__init__.py**

读取现有文件，加入新 import：

```python
# 在现有 import 后追加
from app.models.prompt import Prompt, PromptFavorite, PromptStat  # noqa: F401
```

- [ ] **Step 3: 确认无语法错误**

```bash
cd backend
poetry run python -c "from app.models.prompt import Prompt, PromptFavorite, PromptStat; print('OK')"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/prompt.py backend/app/models/__init__.py
git commit -m "feat: add Prompt, PromptFavorite, PromptStat models"
```

---

### Task 2: Alembic Migration

**Files:**
- Create: `backend/alembic/versions/<新hash>_prompt_tables.py`

无法运行 `alembic revision --autogenerate`（本地无 DB），手动写 migration。

- [ ] **Step 1: 生成空 revision**

```bash
cd backend
poetry run alembic revision -m "prompt_tables"
```

记录输出的文件名（如 `alembic/versions/abc123_prompt_tables.py`）。

- [ ] **Step 2: 写入 upgrade / downgrade**

打开生成的文件，用以下内容替换 upgrade/downgrade 函数：

```python
def upgrade() -> None:
    op.create_table(
        "prompts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("model_name", sa.String(50), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("scenario", sa.String(200), nullable=False),
        sa.Column("summary", sa.Text, nullable=False),
        sa.Column("prompt_zh", sa.Text, nullable=False),
        sa.Column("prompt_en", sa.Text, nullable=False),
        sa.Column("tags", postgresql.JSONB, nullable=False, server_default="'[]'::jsonb"),
        sa.Column("variables", postgresql.JSONB, nullable=False, server_default="'[]'::jsonb"),
        sa.Column("usage_tips", postgresql.JSONB, nullable=False, server_default="'[]'::jsonb"),
        sa.Column("difficulty", sa.String(10), nullable=False),
        sa.Column("platform", sa.String(100), nullable=False),
        sa.Column("output_type", sa.String(50), nullable=False),
        sa.Column("aspect_ratio", sa.String(20), nullable=False),
        sa.Column("visual", sa.String(30), nullable=False, server_default="'product'"),
        sa.Column("example_image_url", sa.String(500), nullable=True),
        sa.Column("is_premium", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("author", sa.String(100), nullable=False, server_default="'Prompt123 编辑部'"),
        sa.Column("popularity", sa.Integer, nullable=False, server_default="0"),
        sa.Column("updated_at", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_prompts_slug", "prompts", ["slug"], unique=True)
    op.create_index("ix_prompts_model_name", "prompts", ["model_name"])
    op.create_index("ix_prompts_category", "prompts", ["category"])

    op.create_table(
        "prompt_favorites",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("prompt_id", sa.String(36), sa.ForeignKey("prompts.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "prompt_id", name="uq_user_prompt_favorite"),
    )
    op.create_index("ix_prompt_favorites_user_id", "prompt_favorites", ["user_id"])
    op.create_index("ix_prompt_favorites_prompt_id", "prompt_favorites", ["prompt_id"])

    op.create_table(
        "prompt_stats",
        sa.Column("prompt_id", sa.String(36), sa.ForeignKey("prompts.id"), primary_key=True),
        sa.Column("view_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("copy_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("favorite_count", sa.Integer, nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("prompt_stats")
    op.drop_table("prompt_favorites")
    op.drop_index("ix_prompts_category", "prompts")
    op.drop_index("ix_prompts_model_name", "prompts")
    op.drop_index("ix_prompts_slug", "prompts")
    op.drop_table("prompts")
```

文件顶部需要加 import：

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
```

- [ ] **Step 3: 验证 SQL 正确**

```bash
cd backend
poetry run alembic upgrade head --sql 2>&1 | grep -E "(CREATE TABLE|CREATE INDEX|ERROR)"
```

Expected: 看到 3 个 CREATE TABLE 和 5 个 CREATE INDEX，无 ERROR。

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat: prompt_tables migration"
```

---

### Task 3: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/prompt.py`

- [ ] **Step 1: 创建 schemas/prompt.py**

```python
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
```

- [ ] **Step 2: 验证**

```bash
cd backend
poetry run python -c "from app.schemas.prompt import PromptOut, PromptListOut; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/prompt.py
git commit -m "feat: prompt Pydantic schemas"
```

---

### Task 4: Prompts Router（公开接口）

**Files:**
- Create: `backend/app/routers/prompts.py`
- Modify: `backend/app/main.py`

接口设计：
```
GET  /api/prompts/          ← 列表（搜索 + 过滤 + 排序 + 分页）
GET  /api/prompts/favorites ← 当前用户收藏（需登录）
GET  /api/prompts/{slug}    ← 详情
POST /api/prompts/{slug}/view     ← 增加浏览数（不需登录）
POST /api/prompts/{slug}/copy     ← 增加复制数（不需登录）
POST /api/prompts/{slug}/favorite ← 切换收藏（需登录）
```

- [ ] **Step 1: 创建 routers/prompts.py**

```python
# backend/app/routers/prompts.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, update as sql_update, text

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.prompt import Prompt, PromptFavorite, PromptStat
from app.models.user import User
from app.schemas.prompt import FavoriteToggleOut, PromptListOut, PromptOut, PromptStatOut

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


def _stat_for(prompt_id: str, db: Session) -> PromptStat:
    stat = db.get(PromptStat, prompt_id)
    if stat is None:
        stat = PromptStat(prompt_id=prompt_id)
        db.add(stat)
        db.commit()
        db.refresh(stat)
    return stat


def _prompt_to_out(prompt: Prompt, db: Session, user: Optional[User] = None) -> PromptOut:
    stat = db.get(PromptStat, prompt.id)
    stat_out = PromptStatOut(
        view_count=stat.view_count if stat else 0,
        copy_count=stat.copy_count if stat else 0,
        favorite_count=stat.favorite_count if stat else 0,
    )
    is_favorited = False
    if user:
        is_favorited = db.query(PromptFavorite).filter(
            PromptFavorite.user_id == user.id,
            PromptFavorite.prompt_id == prompt.id,
        ).first() is not None
    return PromptOut(
        id=prompt.id,
        slug=prompt.slug,
        title=prompt.title,
        model_name=prompt.model_name,
        category=prompt.category,
        scenario=prompt.scenario,
        summary=prompt.summary,
        prompt_zh=prompt.prompt_zh,
        prompt_en=prompt.prompt_en,
        tags=prompt.tags or [],
        variables=prompt.variables or [],
        usage_tips=prompt.usage_tips or [],
        difficulty=prompt.difficulty,
        platform=prompt.platform,
        output_type=prompt.output_type,
        aspect_ratio=prompt.aspect_ratio,
        visual=prompt.visual,
        example_image_url=prompt.example_image_url,
        is_premium=prompt.is_premium,
        author=prompt.author,
        popularity=prompt.popularity,
        updated_at=prompt.updated_at,
        stat=stat_out,
        is_favorited=is_favorited,
    )


@router.get("/favorites", response_model=PromptListOut)
def get_my_favorites(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav_subq = db.query(PromptFavorite.prompt_id).filter(
        PromptFavorite.user_id == current_user.id
    ).subquery()
    q = db.query(Prompt).filter(Prompt.id.in_(fav_subq))
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return PromptListOut(
        total=total,
        items=[_prompt_to_out(p, db, current_user) for p in items],
    )


@router.get("/", response_model=PromptListOut)
def list_prompts(
    q: Optional[str] = None,
    category: Optional[str] = None,
    model_name: Optional[str] = None,
    difficulty: Optional[str] = None,
    sort: str = Query("热门", pattern="^(热门|最新|收藏最多)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Prompt)
    if q:
        kw = f"%{q}%"
        query = query.filter(
            or_(
                Prompt.title.ilike(kw),
                Prompt.summary.ilike(kw),
                Prompt.scenario.ilike(kw),
                Prompt.platform.ilike(kw),
                text("prompts.tags::text ilike :kw"),
            ).params(kw=kw)
        )
    if category and category != "全部":
        query = query.filter(Prompt.category == category)
    if model_name and model_name != "全部":
        query = query.filter(Prompt.model_name == model_name)
    if difficulty and difficulty != "全部":
        query = query.filter(Prompt.difficulty == difficulty)

    total = query.count()

    if sort == "最新":
        query = query.order_by(Prompt.created_at.desc())
    elif sort == "收藏最多":
        query = (
            query.outerjoin(PromptStat, Prompt.id == PromptStat.prompt_id)
            .order_by(PromptStat.favorite_count.desc().nulls_last())
        )
    else:  # 热门
        query = query.order_by(Prompt.popularity.desc())

    items = query.offset(skip).limit(limit).all()
    return PromptListOut(total=total, items=[_prompt_to_out(p, db) for p in items])


@router.get("/{slug}", response_model=PromptOut)
def get_prompt(slug: str, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.slug == slug).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt 不存在")
    return _prompt_to_out(prompt, db)


@router.post("/{slug}/view", status_code=204)
def increment_view(slug: str, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.slug == slug).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt 不存在")
    stat = _stat_for(prompt.id, db)
    db.execute(
        sql_update(PromptStat)
        .where(PromptStat.prompt_id == prompt.id)
        .values(view_count=PromptStat.view_count + 1)
    )
    db.commit()


@router.post("/{slug}/copy", status_code=204)
def increment_copy(slug: str, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.slug == slug).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt 不存在")
    _stat_for(prompt.id, db)
    db.execute(
        sql_update(PromptStat)
        .where(PromptStat.prompt_id == prompt.id)
        .values(copy_count=PromptStat.copy_count + 1)
    )
    db.commit()


@router.post("/{slug}/favorite", response_model=FavoriteToggleOut)
def toggle_favorite(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompt = db.query(Prompt).filter(Prompt.slug == slug).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt 不存在")
    stat = _stat_for(prompt.id, db)
    existing = db.query(PromptFavorite).filter(
        PromptFavorite.user_id == current_user.id,
        PromptFavorite.prompt_id == prompt.id,
    ).first()
    if existing:
        db.delete(existing)
        db.execute(
            sql_update(PromptStat)
            .where(PromptStat.prompt_id == prompt.id)
            .values(favorite_count=PromptStat.favorite_count - 1)
        )
        db.commit()
        new_count = max(0, stat.favorite_count - 1)
        return FavoriteToggleOut(favorited=False, favorite_count=new_count)
    else:
        db.add(PromptFavorite(user_id=current_user.id, prompt_id=prompt.id))
        db.execute(
            sql_update(PromptStat)
            .where(PromptStat.prompt_id == prompt.id)
            .values(favorite_count=PromptStat.favorite_count + 1)
        )
        db.commit()
        return FavoriteToggleOut(favorited=True, favorite_count=stat.favorite_count + 1)
```

- [ ] **Step 2: 注册 router 到 main.py**

读取 `backend/app/main.py`，在现有 router 注册后追加：

```python
from app.routers.prompts import router as prompts_router
app.include_router(prompts_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/prompts.py backend/app/main.py
git commit -m "feat: prompts router (list, detail, view/copy/favorite)"
```

---

### Task 5: Seed 脚本

**Files:**
- Create: `backend/scripts/seed_prompts.py`

将前端 `frontend/lib/prompts.ts` 里的 11 条 prompt 静态数据迁移到数据库。

- [ ] **Step 1: 创建 seed_prompts.py**

```python
# backend/scripts/seed_prompts.py
"""Seed the 11 prompts from the frontend static data into the database."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.prompt import Prompt, PromptStat

PROMPTS = [
    dict(
        slug="taobao-premium-white-background",
        title="淘宝质感白底主图",
        model_name="GPT-Image-2",
        category="电商商品图",
        scenario="淘宝 / 天猫主图",
        summary="保留商品比例，强化白底阴影、材质细节和上架质感。",
        tags=["电商", "白底", "主图", "商品保真"],
        visual="product",
        popularity=98,
        difficulty="入门",
        platform="淘宝 / 天猫",
        output_type="商品主图",
        aspect_ratio="1:1",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["商品描述"],
        prompt_zh="为 {商品描述} 生成一张淘宝/天猫风格的高质感白底商品主图。保持商品主体比例真实、轮廓清晰、材质细节可见，使用柔和棚拍光、轻微自然阴影、干净纯白背景。画面中心构图，不添加无关道具，不生成品牌 Logo，不生成夸张促销文字。",
        prompt_en="Create a premium Taobao/Tmall product hero image for {product description}. Keep the product proportion accurate, silhouette clean, and material details visible. Use soft studio lighting, subtle natural shadows, and a pure white background. Centered composition, no unrelated props, no brand logo, no exaggerated promotional text.",
        usage_tips=["适合有参考商品图时使用", "文字和价格建议后期叠加", "主体必须清晰，避免背景过度花哨"],
    ),
    dict(
        slug="pdd-promotion-main-image",
        title="拼多多爆款促销图",
        model_name="GPT-Image-2",
        category="电商商品图",
        scenario="拼多多主图 / 活动图",
        summary="高饱和背景、价格气泡、强卖点位置，为测图准备多个版本。",
        tags=["拼多多", "促销", "测图", "高点击"],
        visual="sale",
        popularity=95,
        difficulty="进阶",
        platform="拼多多",
        output_type="促销主图",
        aspect_ratio="1:1",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["商品描述"],
        prompt_zh="为 {商品描述} 生成拼多多爆款促销主图。商品主体要大、清晰、位于画面中心偏右，背景使用红橙高能量促销色，预留左上角价格气泡和底部卖点区域。整体风格热闹、直接、有强点击感，但不要生成具体价格数字和虚假功效。",
        prompt_en="Create a Pinduoduo-style viral promotional product image for {product description}. The product should be large, sharp, and placed slightly right of center. Use energetic red-orange promotional colors, reserve a top-left price bubble area and a bottom selling-point area. Make it direct and click-worthy, but do not generate actual prices or false claims.",
        usage_tips=["适合低价爆款、活动测图", "价格、满减、销量等必须人工审核", "同一商品建议生成 4 个版本做对比"],
    ),
    dict(
        slug="xiaohongshu-product-cover",
        title="小红书商品封面海报",
        model_name="GPT-Image-2",
        category="海报排版",
        scenario="小红书封面 / 种草图",
        summary="把商品融入生活方式场景，保留干净标题区和笔记感排版。",
        tags=["小红书", "封面", "生活方式", "种草"],
        visual="poster",
        popularity=91,
        difficulty="入门",
        platform="小红书",
        output_type="社媒封面",
        aspect_ratio="3:4",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["商品描述"],
        prompt_zh="为 {商品描述} 生成一张小红书风格商品封面。画面要有生活方式氛围，柔和自然光，背景干净有质感，主体商品清晰可见。预留上方或左侧标题留白区域，整体像高质量种草笔记封面，色调清爽、精致、不过度商业化。",
        prompt_en="Create a Xiaohongshu-style product cover for {product description}. Use a lifestyle atmosphere, soft natural light, clean textured background, and a clearly visible product. Reserve whitespace for title text at the top or left. The result should feel like a high-quality recommendation post, fresh, refined, and not overly commercial.",
        usage_tips=["更适合美妆、服饰、家居类商品", "标题建议后期叠加", "主体不要太小"],
    ),
    dict(
        slug="nano-banana-character-consistency",
        title="人物一致性写真",
        model_name="Nano Banana",
        category="人物写真",
        scenario="人物参考图延展",
        summary="用同一人物生成多套服装、场景和镜头角度，保持脸部一致。",
        tags=["人物", "写真", "一致性", "参考图"],
        visual="portrait",
        popularity=96,
        difficulty="专业",
        platform="Gemini Nano Banana",
        output_type="人物写真",
        aspect_ratio="3:4",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["场景/服装描述"],
        prompt_zh="基于上传的人物参考图，保持人物面部特征、年龄感、发型和整体气质一致。为人物生成 {场景/服装描述} 的写真图，使用真实摄影质感、自然皮肤纹理、柔和光线和干净背景。不要改变五官，不要过度美颜，不要生成夸张姿势。",
        prompt_en="Based on the uploaded character reference, preserve the person's facial features, perceived age, hairstyle, and overall temperament. Generate a portrait in {scene/outfit description} with realistic photographic quality, natural skin texture, soft lighting, and a clean background. Do not alter facial identity, over-beautify, or create exaggerated poses.",
        usage_tips=["必须上传清晰正脸参考图", "一次只改一个变量：服装或场景", "适合做证件照、职业照、种草头像"],
    ),
    dict(
        slug="nano-banana-blind-box-toy",
        title="手办盲盒包装",
        model_name="Nano Banana",
        category="3D 手办",
        scenario="人物/商品 3D 化",
        summary="把人物或商品转成 3D 手办，并生成透明盒、吊牌和陈列背景。",
        tags=["3D", "手办", "盲盒", "包装"],
        visual="toy",
        popularity=93,
        difficulty="进阶",
        platform="Gemini Nano Banana",
        output_type="创意合成",
        aspect_ratio="1:1",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["参考主体"],
        prompt_zh="将参考图中的 {参考主体} 转化为精致 3D 手办，保持主体最有辨识度的外观特征。生成透明盲盒包装、底座、标签卡和桌面陈列场景。整体风格像高端收藏玩具摄影，材质细腻，灯光柔和，画面干净，避免文字乱码。",
        prompt_en="Turn {reference subject} in the reference image into a refined 3D collectible figure while preserving the most recognizable visual features. Generate a transparent blind-box package, base stand, label card, and tabletop display scene. The style should feel like premium collectible toy photography with fine materials, soft lighting, and a clean composition. Avoid garbled text.",
        usage_tips=["适合做爆款社媒内容", "包装文字尽量后期做", "人物参考图越清晰越稳定"],
    ),
    dict(
        slug="nano-banana-local-repaint",
        title="参考图局部重绘",
        model_name="Nano Banana",
        category="图片编辑",
        scenario="换背景 / 换材质 / 换服装",
        summary="只改背景、材质、服装或道具，不破坏主体结构。",
        tags=["局部编辑", "换背景", "保主体"],
        visual="edit",
        popularity=88,
        difficulty="专业",
        platform="Gemini Nano Banana",
        output_type="图片编辑",
        aspect_ratio="原图比例",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["需要修改的区域", "目标风格/材质/场景"],
        prompt_zh="基于参考图进行局部编辑，只修改 {需要修改的区域}，保持其他区域完全一致。主体结构、透视、比例、边缘和光影关系必须自然。新区域风格为 {目标风格/材质/场景}，不要改变主体身份，不要引入无关元素。",
        prompt_en="Perform a local edit based on the reference image. Only modify {target area to edit} and keep all other areas unchanged. Preserve subject structure, perspective, proportions, edges, and lighting consistency. The new area should match {target style/material/scene}. Do not alter the subject identity or introduce unrelated elements.",
        usage_tips=["描述修改范围越具体越好", "用于电商换背景很实用", "避免一次修改多个大区域"],
    ),
    dict(
        slug="brand-logo-moodboard",
        title="品牌 Logo 氛围提案",
        model_name="Midjourney",
        category="品牌 Logo",
        scenario="品牌视觉探索",
        summary="从行业关键词扩展成标志、色彩、材质和品牌应用场景。",
        tags=["Logo", "品牌", "VI", "提案"],
        visual="logo",
        popularity=84,
        difficulty="进阶",
        platform="Midjourney",
        output_type="品牌提案",
        aspect_ratio="16:9",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["品牌/行业描述"],
        prompt_zh="为 {品牌/行业描述} 创建一组高端品牌 Logo 氛围提案。包含极简标志、品牌色板、字体气质、名片和包装应用场景。整体视觉应专业、克制、有高级感，适合商业品牌提案。不要生成复杂小字。",
        prompt_en="Create a premium brand logo moodboard for {brand/industry description}. Include a minimalist mark, color palette, typography direction, business card, and packaging application scene. The visual should be professional, restrained, and premium, suitable for a commercial brand proposal. Avoid complex tiny text.",
        usage_tips=["适合前期风格探索，不等于最终商标", "商用前需重新设计和查重", "避免直接生成可注册商标承诺"],
    ),
    dict(
        slug="cinematic-scene-poster",
        title="电影感场景海报",
        model_name="Midjourney",
        category="海报排版",
        scenario="宣传海报 / 概念图",
        summary="控制镜头、光影、色温和构图，生成强叙事视觉。",
        tags=["电影感", "海报", "构图"],
        visual="cinema",
        popularity=86,
        difficulty="进阶",
        platform="Midjourney",
        output_type="概念海报",
        aspect_ratio="16:9",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["主题描述"],
        prompt_zh="生成一张电影感场景海报，主题为 {主题描述}。使用宽银幕构图、强叙事光影、明确前景/中景/背景层次、戏剧化色温和高质量摄影质感。画面要有故事张力，保留标题排版空间，不生成具体文字。",
        prompt_en="Generate a cinematic scene poster about {theme description}. Use widescreen composition, narrative lighting, clear foreground/midground/background layers, dramatic color temperature, and high-quality photographic texture. The image should have strong storytelling tension and reserved space for title typography. Do not generate actual text.",
        usage_tips=["适合广告视觉和概念海报", "把主题、时间、地点写清楚", "文字最好后期排版"],
    ),
    dict(
        slug="social-infographic-layout",
        title="信息图与社媒排版",
        model_name="Midjourney",
        category="海报排版",
        scenario="信息卡 / 长图 / 封面",
        summary="把复杂卖点整理成高可读的信息卡、长图和封面版式。",
        tags=["信息图", "社媒", "版式"],
        visual="layout",
        popularity=82,
        difficulty="入门",
        platform="小红书 / 公众号",
        output_type="版式参考",
        aspect_ratio="3:4",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["内容主题"],
        prompt_zh="为 {内容主题} 生成一张现代信息图版式参考。画面包含清晰的信息分区、卡片式模块、图标占位、数据视觉化区域和标题留白。风格干净、专业、适合社媒传播。不要生成可读小字，只保留版式结构。",
        prompt_en="Generate a modern infographic layout reference for {content topic}. Include clear information sections, card modules, icon placeholders, data visualization areas, and title whitespace. The style should be clean, professional, and suitable for social media. Do not generate readable tiny text; focus on layout structure.",
        usage_tips=["适合先出视觉骨架", "正式文字建议后期叠加", "用于课程、知识卡、产品介绍"],
    ),
    dict(
        slug="ecommerce-short-video-opening",
        title="商品短视频开场",
        model_name="Video",
        category="视频分镜",
        scenario="3 秒开场镜头",
        summary="3 秒抓眼球镜头，包含运动轨迹、转场、光线和主体动作。",
        tags=["短视频", "镜头", "电商"],
        visual="video",
        popularity=89,
        difficulty="进阶",
        platform="可灵 / 即梦 / Seedance",
        output_type="视频分镜",
        aspect_ratio="9:16",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["商品描述"],
        prompt_zh="为 {商品描述} 设计 3 秒短视频开场镜头。镜头从极近距离的产品材质细节开始，快速拉远到完整商品，背景光线扫过主体，最后定格在可放标题的位置。节奏干净、有冲击力，适合电商种草视频。",
        prompt_en="Design a 3-second opening shot for a short product video about {product description}. Start with an extreme close-up of the product material details, quickly pull back to reveal the full product, let background light sweep across the subject, and end with a composition that leaves space for title text. Clean, impactful, suitable for e-commerce social video.",
        usage_tips=["适合可灵、即梦、Seedance", "每条视频 prompt 只描述一个镜头", "镜头动作要明确"],
    ),
    dict(
        slug="vlog-scene-transition",
        title="Vlog 风场景切换",
        model_name="Video",
        category="视频分镜",
        scenario="生活方式视频",
        summary="把生活场景拆成可连续生成的镜头组，适合种草内容。",
        tags=["Vlog", "场景", "节奏"],
        visual="vlog",
        popularity=80,
        difficulty="入门",
        platform="可灵 / 即梦 / Seedance",
        output_type="视频分镜",
        aspect_ratio="9:16",
        updated_at="2026-05-20",
        author="Prompt123 编辑部",
        variables=["商品/道具", "目标场景"],
        prompt_zh="生成一段 Vlog 风格的场景切换镜头：人物拿起 {商品/道具}，镜头跟随手部动作向右平移，转场到 {目标场景}，保持自然手持摄影感、柔和日光、真实生活氛围。动作连贯，画面温暖，适合种草内容。",
        prompt_en="Generate a Vlog-style scene transition shot: a person picks up {product/prop}, the camera follows the hand movement and pans right, transitioning into {target scene}. Keep a natural handheld camera feel, soft daylight, and realistic lifestyle atmosphere. Smooth motion, warm visuals, suitable for recommendation content.",
        usage_tips=["适合生活方式账号", "场景切换不要太复杂", "明确人物动作和镜头方向"],
    ),
]


def seed():
    db = SessionLocal()
    try:
        added = 0
        for data in PROMPTS:
            existing = db.query(Prompt).filter(Prompt.slug == data["slug"]).first()
            if existing:
                continue
            prompt = Prompt(**data)
            db.add(prompt)
            db.flush()
            db.add(PromptStat(prompt_id=prompt.id))
            added += 1
        db.commit()
        print(f"Seeded {added} prompts ({len(PROMPTS) - added} already existed).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
```

- [ ] **Step 2: 语法检查**

```bash
cd backend
poetry run python -c "import scripts.seed_prompts; print('OK')"
```

Expected: `OK`（无法真正运行，因没有 DB，但语法应无错）

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/seed_prompts.py
git commit -m "feat: seed script for 11 prompts"
```

---

### Task 6: 测试

**Files:**
- Create: `backend/app/tests/test_prompts.py`

测试使用 SQLite in-memory（同现有测试，用 conftest.py 的 `client` fixture）。JSONB 在 SQLite 下用 JSON 类型替代——需要在测试中用 SQLite 兼容方式创建表。

> **注意**：JSONB 是 PostgreSQL 专属类型，SQLite 测试中会报错。解决方案：在 conftest.py 里用 SQLite 前，先把 JSONB 列替换为 JSON（通过 event listener 或直接在测试 model 用 JSON）。最简单的做法是在 conftest 的 `setup_db` fixture 里，在 `Base.metadata.create_all` 之前，将 JSONB 列的类型临时替换。

以下是完整测试，包含 JSONB → JSON 兼容处理：

```python
# backend/app/tests/test_prompts.py
import pytest
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON
from app.models.prompt import Prompt, PromptFavorite, PromptStat


def _patch_jsonb_for_sqlite():
    """Replace JSONB columns with JSON for SQLite compatibility in tests."""
    for col in Prompt.__table__.columns:
        if isinstance(col.type, JSONB):
            col.type = JSON()


_patch_jsonb_for_sqlite()


SAMPLE = dict(
    slug="test-prompt-slug",
    title="测试 Prompt",
    model_name="GPT-Image-2",
    category="电商商品图",
    scenario="测试场景",
    summary="测试摘要",
    prompt_zh="测试中文提示词",
    prompt_en="test english prompt",
    tags=["电商", "测试"],
    variables=["变量1"],
    usage_tips=["提示1"],
    difficulty="入门",
    platform="淘宝",
    output_type="主图",
    aspect_ratio="1:1",
    visual="product",
    author="测试员",
    popularity=50,
    updated_at="2026-05-21",
)


def _seed_prompt(db):
    p = Prompt(**SAMPLE)
    db.add(p)
    db.flush()
    db.add(PromptStat(prompt_id=p.id))
    db.commit()
    return p


def test_list_prompts_returns_empty(client):
    resp = client.get("/api/prompts/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_list_prompts_returns_seeded(client, db_session):
    _seed_prompt(db_session)
    resp = client.get("/api/prompts/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "test-prompt-slug"


def test_get_prompt_detail(client, db_session):
    _seed_prompt(db_session)
    resp = client.get("/api/prompts/test-prompt-slug")
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "测试 Prompt"
    assert data["stat"]["view_count"] == 0


def test_get_prompt_not_found(client):
    resp = client.get("/api/prompts/nonexistent")
    assert resp.status_code == 404


def test_increment_view(client, db_session):
    _seed_prompt(db_session)
    resp = client.post("/api/prompts/test-prompt-slug/view")
    assert resp.status_code == 204
    detail = client.get("/api/prompts/test-prompt-slug").json()
    assert detail["stat"]["view_count"] == 1


def test_increment_copy(client, db_session):
    _seed_prompt(db_session)
    resp = client.post("/api/prompts/test-prompt-slug/copy")
    assert resp.status_code == 204
    detail = client.get("/api/prompts/test-prompt-slug").json()
    assert detail["stat"]["copy_count"] == 1


def test_filter_by_category(client, db_session):
    _seed_prompt(db_session)
    resp = client.get("/api/prompts/?category=电商商品图")
    assert resp.json()["total"] == 1
    resp2 = client.get("/api/prompts/?category=海报排版")
    assert resp2.json()["total"] == 0


def test_search_by_keyword(client, db_session):
    _seed_prompt(db_session)
    resp = client.get("/api/prompts/?q=测试摘要")
    assert resp.json()["total"] == 1
    resp2 = client.get("/api/prompts/?q=不存在的关键词xyz")
    assert resp2.json()["total"] == 0
```

conftest.py 需要新增 `db_session` fixture 供直接操作 DB 的测试使用。读取 `backend/app/tests/conftest.py`，追加：

```python
@pytest.fixture
def db_session(setup_db):
    from app.database import SessionLocal
    from app.tests.conftest import engine  # 用测试 engine
    # 实际上直接用 app.database.get_db override 的同一个 SQLite session
    from sqlalchemy.orm import Session
    with Session(engine) as session:
        yield session
```

> **注意**：conftest 里的 `engine` 变量是 SQLite test engine。如果它不是 module-level 变量，需要先读 conftest.py，确认变量名，再写正确的 import。

- [ ] **Step 1: 读取现有 conftest.py，确认 engine 变量名和 setup_db fixture 结构**

读取 `backend/app/tests/conftest.py`，确认现有结构后按实际情况实现 `db_session` fixture。

- [ ] **Step 2: 写入测试文件**

按上方代码写入 `backend/app/tests/test_prompts.py`。

- [ ] **Step 3: 运行测试**

```bash
cd backend
poetry run pytest app/tests/test_prompts.py -v
```

Expected: 8 tests pass（如有失败，根据错误信息修复后重试）。

- [ ] **Step 4: 运行全套测试**

```bash
poetry run pytest app/tests/ -v
```

Expected: 所有测试通过。

- [ ] **Step 5: Commit**

```bash
git add backend/app/tests/test_prompts.py backend/app/tests/conftest.py
git commit -m "test: prompts API tests with SQLite JSONB compatibility"
```

---

## 自检：Spec 覆盖确认

| 需求 | 覆盖 Task |
|------|-----------|
| prompts 表 | Task 1 |
| prompt_favorites 表 | Task 1 |
| prompt_views / copies 计数 | Task 1 (PromptStat) |
| 收藏 API（登录用户） | Task 4 |
| 浏览/复制计数 API | Task 4 |
| 搜索（关键词过滤） | Task 4 |
| 分类/模型/难度过滤 | Task 4 |
| 排序：热门/最新/收藏最多 | Task 4 |
| Seed 11 条现有 prompt | Task 5 |
| 测试覆盖 | Task 6 |
