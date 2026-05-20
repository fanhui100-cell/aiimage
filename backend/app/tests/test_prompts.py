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
