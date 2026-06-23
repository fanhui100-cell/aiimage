-- ════════════════════════════════════════════════════════════════════════
-- p6-audio-pipeline.sql — R6 audio pipeline schema additions (isolated migration).
--
-- Does NOT edit p4 in place. Adds the columns the synth→upload→review pipeline needs
-- and a DB-level idempotency guard. Safe to re-run (IF NOT EXISTS / conditional).
--
--   • storage_path       — object key in the PRIVATE Supabase Storage bucket (qbank-audio).
--                          `url` keeps the same path (NOT NULL); playback is via a SERVER-SIGNED
--                          short-lived URL (session-builder), never a public URL.
--   • synth_instructions — the exact synthesis settings used (SSML voice/rate/format), for audit + repro.
--   • reviewed_by / reviewed_at — human listening-review evidence; required before an asset is active.
--   • UNIQUE(checksum)   — DB-level idempotency: the same (transcript+voice+accent+provider+format)
--                          can never be inserted twice, even under concurrent runs.
--
-- APPLY GATE: a reviewer applies this in Supabase (like p5), then the R6 pipeline is exercised.
-- ════════════════════════════════════════════════════════════════════════

alter table audio_assets add column if not exists storage_path       text;
alter table audio_assets add column if not exists synth_instructions text;
alter table audio_assets add column if not exists reviewed_by        text;
alter table audio_assets add column if not exists reviewed_at        timestamptz;

-- DB-level idempotency: one asset per content+voice checksum. Partial index so legacy null
-- checksums (none expected) don't collide.
create unique index if not exists uniq_v2_audio_checksum
  on audio_assets (checksum)
  where checksum is not null;

-- Safety: an asset may only be 'active' once it carries human-review evidence.
-- (Enforced as a CHECK so a stray direct UPDATE cannot bypass the review gate.)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'audio_active_requires_review') then
    alter table audio_assets
      add constraint audio_active_requires_review
      check (qa_status <> 'active' or (reviewed_by is not null and reviewed_at is not null));
  end if;
end $$;
