-- ════════════════════════════════════════════════════════════════════════
-- p5-question-bank-promotion-rpc.sql — R9 transactional draft→active promotion.
--
-- Replaces the best-effort client-side rollback in promote-question-sets-v2.ts with ONE
-- PostgreSQL function that validates and promotes a set + all its items atomically.
--
-- Contract:
--   • accepts ONLY an explicit array of set UUIDs (never a broad type/level predicate);
--   • locks the candidate sets/items (FOR UPDATE);
--   • per set, rejects (no state change, returns a reason) unless ALL hold:
--       - set status = 'draft' (already 'active' → idempotent no-op 'already_active');
--       - task_type not deprecated (antonym_choice / cet_cloze);
--       - qa_flags.scoring_not_ready != true AND qa_flags.official_spec_unverified != true;
--       - >=1 item, every item status='draft', every item.answer not null;
--       - productive items (input_mode in free_text/speak) have rubric_id;
--       - listening sets (task_type listening_comprehension OR any item input_mode='listen')
--         have an ACTIVE audio asset on their stimulus;
--       - if stimulus_id set, the stimulus row exists (FK sanity);
--   • valid sets: items→active then set→active, in this single transaction;
--   • ANY unexpected database error aborts the function → the whole transaction rolls back,
--     so a partial 'active set + draft items' (or vice-versa) state is impossible;
--   • returns one row per input id: (set_id, result, reason) with result in
--     {promoted, already_active, rejected};
--   • idempotent: re-running with already-active approved ids changes nothing.
--
-- Execution: server/admin (service_role) only — EXECUTE is revoked from PUBLIC.
-- APPLY GATE: do NOT auto-apply. A reviewer applies this in Supabase, then
-- `scripts/validate-promotion-rpc.ts` is run to verify behavior.
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.promote_question_sets_v2(p_set_ids uuid[])
returns table (set_id uuid, result text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_set question_sets%rowtype;
  v_n int;
  v_bad int;
  v_is_listening boolean;
  v_has_active_audio boolean;
begin
  if p_set_ids is null or array_length(p_set_ids, 1) is null then
    return;
  end if;

  -- lock candidates (and their items) to serialize concurrent promotions
  perform 1 from question_sets where id = any(p_set_ids) for update;
  perform 1 from question_items where question_set_id = any(p_set_ids) for update;

  foreach v_id in array p_set_ids loop
    select * into v_set from question_sets where id = v_id;
    if not found then
      set_id := v_id; result := 'rejected'; reason := 'not_found'; return next; continue;
    end if;
    if v_set.status = 'active' then
      set_id := v_id; result := 'already_active'; reason := 'idempotent'; return next; continue;
    end if;
    if v_set.status <> 'draft' then
      set_id := v_id; result := 'rejected'; reason := 'not_draft:' || v_set.status; return next; continue;
    end if;
    if v_set.task_type in ('antonym_choice', 'cet_cloze') then
      set_id := v_id; result := 'rejected'; reason := 'deprecated_type'; return next; continue;
    end if;
    if coalesce(v_set.qa_flags->>'scoring_not_ready', '') = 'true' then
      set_id := v_id; result := 'rejected'; reason := 'scoring_not_ready'; return next; continue;
    end if;
    if coalesce(v_set.qa_flags->>'official_spec_unverified', '') = 'true' then
      set_id := v_id; result := 'rejected'; reason := 'official_spec_unverified'; return next; continue;
    end if;

    select count(*) into v_n from question_items where question_set_id = v_id;
    if v_n = 0 then
      set_id := v_id; result := 'rejected'; reason := 'no_items'; return next; continue;
    end if;
    select count(*) into v_bad from question_items where question_set_id = v_id and status <> 'draft';
    if v_bad > 0 then
      set_id := v_id; result := 'rejected'; reason := 'items_not_draft'; return next; continue;
    end if;
    select count(*) into v_bad from question_items where question_set_id = v_id and answer is null;
    if v_bad > 0 then
      set_id := v_id; result := 'rejected'; reason := 'item_answer_null'; return next; continue;
    end if;
    select count(*) into v_bad from question_items
      where question_set_id = v_id and input_mode in ('free_text', 'speak') and rubric_id is null;
    if v_bad > 0 then
      set_id := v_id; result := 'rejected'; reason := 'productive_without_rubric'; return next; continue;
    end if;

    v_is_listening := v_set.task_type = 'listening_comprehension'
      or exists (select 1 from question_items where question_set_id = v_id and input_mode = 'listen');
    if v_is_listening then
      v_has_active_audio := v_set.stimulus_id is not null
        and exists (select 1 from audio_assets where stimulus_id = v_set.stimulus_id and qa_status = 'active');
      if not v_has_active_audio then
        set_id := v_id; result := 'rejected'; reason := 'listening_without_active_audio'; return next; continue;
      end if;
    end if;

    if v_set.stimulus_id is not null and not exists (select 1 from stimuli where id = v_set.stimulus_id) then
      set_id := v_id; result := 'rejected'; reason := 'stimulus_fk_missing'; return next; continue;
    end if;

    -- all invariants hold → promote items then set (atomic within this function transaction)
    update question_items set status = 'active' where question_set_id = v_id;
    update question_sets set status = 'active' where id = v_id;
    set_id := v_id; result := 'promoted'; reason := 'ok'; return next;
  end loop;
end;
$$;

-- server/admin execution only
revoke all on function public.promote_question_sets_v2(uuid[]) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.promote_question_sets_v2(uuid[]) to service_role;
  end if;
end $$;
