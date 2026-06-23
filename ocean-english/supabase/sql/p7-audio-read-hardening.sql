-- ════════════════════════════════════════════════════════════════════════
-- p7-audio-read-hardening.sql — R6 read-side hardening (column-level transcript lockout).
--
-- The R6 review found that audio_assets.transcript is readable by the browser anon/authenticated
-- key for any qa_status='active' row (the RLS policy in p4 is ROW-level only). The "practice mode
-- doesn't select transcript" discipline was a client convention, not a server-enforced control —
-- a hand-crafted client query could read the listening transcript before the user answers.
--
-- Fix: column-level REVOKE so NO client role (anon/authenticated) can SELECT transcript at all.
-- The server (service_role, used by session-builder + the post-submit review path) bypasses this
-- and remains the ONLY way transcript reaches a client — and only AFTER submission.
-- Other columns (id/url/duration_ms/accent/voice_id/...) stay readable so playback metadata works.
--
-- Idempotent / safe to re-run. APPLY GATE: a reviewer applies this in Supabase (like p5/p6).
-- ════════════════════════════════════════════════════════════════════════

-- Remove the transcript column from the client roles' SELECT privilege.
-- (Postgres column-level REVOKE: table-level SELECT remains for the other columns.)
revoke select (transcript) on audio_assets from anon;
revoke select (transcript) on audio_assets from authenticated;

-- Defensive: ensure service_role retains full read (it is the only transcript reader, server-side).
grant select on audio_assets to service_role;

-- NOTE: storage_path / url hold the PRIVATE object key — useless to a client without a
-- server-minted signed URL, so they remain selectable (playback metadata). Only the human-readable
-- transcript is locked out. True per-attempt answer-gating of the review transcript is delivered
-- via the post-submit session review payload (R3/R11), server-side only.
