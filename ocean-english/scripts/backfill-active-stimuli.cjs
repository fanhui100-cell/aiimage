/* Activate stimuli of active question_sets. The R9 promote RPC promoted set+items but NOT their
   stimulus, so the session-builder (which fetches stimuli with qa_status='active') served every
   active set WITHOUT its passage/material/audio (stimulusOut is undefined when stim is draft).
   Invariant restored: an active set's stimulus must be active. Dry-run default; --apply to write. */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const rd = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1].trim();
const db = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'));
const APPLY = process.argv.includes('--apply');
(async () => {
  let sets = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await db.from('question_sets').select('stimulus_id').eq('status', 'active').not('stimulus_id', 'is', null).range(f, f + 999);
    if (!data || !data.length) break; sets = sets.concat(data); if (data.length < 1000) break;
  }
  const ids = [...new Set(sets.map((s) => s.stimulus_id).filter(Boolean))];
  // which are currently not active
  const draftIds = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await db.from('stimuli').select('id,qa_status').in('id', ids.slice(i, i + 100));
    for (const x of data || []) if (x.qa_status !== 'active') draftIds.push(x.id);
  }
  console.log('active sets stimuli:', ids.length, '| not-active (to activate):', draftIds.length, APPLY ? '(APPLY)' : '(DRY-RUN)');
  if (!APPLY) { console.log('DRY-RUN — no writes'); return; }
  let done = 0;
  for (let i = 0; i < draftIds.length; i += 200) {
    const { error } = await db.from('stimuli').update({ qa_status: 'active' }).in('id', draftIds.slice(i, i + 200));
    if (error) { console.log('ERR', error.message); break; } done += draftIds.slice(i, i + 200).length;
  }
  console.log('activated stimuli:', done);
})();
