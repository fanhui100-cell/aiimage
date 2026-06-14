-- ============================================================
-- LexiOcean P3.1: 单词配图列
-- 给 dictionary_words 加 image_url（AI 批量生成图存 Supabase Storage 后回填）。
-- 词卡/闪卡/题卡有图则显示、无图优雅降级。读取走现有公开读策略。
-- 说明：在 Supabase SQL Editor 运行一次。可安全重跑。
-- ============================================================

ALTER TABLE dictionary_words ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 可选：标记配图来源/状态，便于增量生成与审核
ALTER TABLE dictionary_words ADD COLUMN IF NOT EXISTS image_source TEXT;  -- 'ai' | 'open' | null
