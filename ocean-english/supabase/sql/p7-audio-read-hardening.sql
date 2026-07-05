-- ════════════════════════════════════════════════════════════════════════
-- p7-audio-read-hardening.sql — R6 read-side hardening (column-level transcript lockout).
--
-- The R6 review found audio_assets.transcript is readable by the browser anon/authenticated key
-- for any qa_status='active' row (the p4 RLS policy is ROW-level only) — the "practice mode doesn't
-- select transcript" discipline was a client convention, not server-enforced. A hand-crafted client
-- query could read the listening transcript before the user answers.
--
-- IMPORTANT: Supabase grants anon/authenticated TABLE-level SELECT (all columns) by default, so a
-- column-level `REVOKE SELECT (transcript)` does NOTHING (the table grant still covers it). The
-- correct pattern is to REVOKE the table-level SELECT, then GRANT SELECT only on the non-transcript
-- columns. service_role keeps full read (it is the only server-side transcript reader, post-submit).
--
-- Idempotent / safe to re-run. APPLY GATE: a reviewer applies this in Supabase (like p5/p6).
-- ════════════════════════════════════════════════════════════════════════

-- 1) Remove the blanket table-level SELECT from the client roles.
revoke select on audio_assets from anon;
revoke select on audio_assets from authenticated;

-- 2) Re-grant SELECT only on the non-transcript columns (everything EXCEPT transcript).
grant select (id, stimulus_id, url, storage_path, duration_ms, accent, voice_id, provider, checksum, qa_status, synth_instructions, reviewed_by, reviewed_at, created_at, updated_at) on audio_assets to anon;
grant select (id, stimulus_id, url, storage_path, duration_ms, accent, voice_id, provider, checksum, qa_status, synth_instructions, reviewed_by, reviewed_at, created_at, updated_at) on audio_assets to authenticated;

-- 3) service_role retains full read (transcript reaches a client ONLY via the server, post-submit).
grant select on audio_assets to service_role;

-- (Harmless leftover from the first p7 draft; column-level revoke is a no-op once table-level is gone.)
revoke select (transcript) on audio_assets from anon;
revoke select (transcript) on audio_assets from authenticated;

-- NOTE: storage_path/url hold the PRIVATE object key — useless without a server-minted signed URL,
-- so they stay readable (playback metadata). Only the human-readable transcript is locked out.
-- True per-attempt answer-gating of the review transcript is delivered via the post-submit session
-- review payload (R3/R11), server-side only.
