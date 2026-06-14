-- ============================================================
-- LexiOcean P3.5: Web Push 订阅
-- 存浏览器推送订阅（PWA 复习提醒）。每用户可多设备多订阅。
-- 依赖：profiles（phase-5c）。发送端用 service role 读取并推送。
-- 还需在 .env 配置 VAPID 公私钥（VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY）。
-- 说明：在 Supabase SQL Editor 运行一次。可安全重跑。
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_own_data" ON push_subscriptions;
CREATE POLICY "push_subscriptions_own_data"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
