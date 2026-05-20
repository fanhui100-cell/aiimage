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


@router.get("/hot", response_model=PromptListOut)
def get_hot_prompts(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    items = (
        db.query(Prompt)
        .outerjoin(PromptStat, Prompt.id == PromptStat.prompt_id)
        .order_by(PromptStat.view_count.desc().nulls_last())
        .limit(limit)
        .all()
    )
    return PromptListOut(total=len(items), items=[_prompt_to_out(p, db) for p in items])


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
                text("prompts.tags::text ilike :kw").bindparams(kw=kw),
            )
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
    else:
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
    _stat_for(prompt.id, db)
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
