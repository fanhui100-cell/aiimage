import pytest
from unittest.mock import AsyncMock, patch, MagicMock

@pytest.mark.asyncio
async def test_expand_keywords_returns_string():
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="blue minimalist dress spring fashion photography"))]
    with patch("app.services.prompt_builder.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        from app.services.prompt_builder import expand_keywords
        result = await expand_keywords("蓝色 简约 女装连衣裙 春季")
    assert isinstance(result, str)
    assert len(result) > 10

@pytest.mark.asyncio
async def test_expand_keywords_rejects_empty():
    from app.services.prompt_builder import expand_keywords
    with pytest.raises(ValueError, match="empty"):
        await expand_keywords("   ")
