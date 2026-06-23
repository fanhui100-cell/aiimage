/* Backfill question_sets.exam_id from level (bijective per EXAM_SPECS) for generated sets
   where exam_id IS NULL. Serving/paper builders filter by exam_id; NULL made active content
   unreachable via exam-scoped requests. Dry-run by default; --apply to write. */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const rd = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1].trim();
const db = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'));
const L2E = { 1: 'zhongkao', 2: 'gaokao', 3: 'cet4', 4: 'cet6', 5: 'kaoyan', 6: 'toefl', 7: 'sat' };
const APPLY = process.argv.includes('--apply');
const ACTIVE_ONLY = process.argv.includes('--active-only');
(async () => {
  // count NULL exam_id sets by level + status
  let sets = [];
  for (let f = 0; ; f += 1000) {
    let q = db.from('question_sets').select('id,level,status,exam_id').is('exam_id', null).not('level', 'is', null).range(f, f + 999);
    const { data } = await q;
    if (!data || !data.length) break; sets = sets.concat(data); if (data.length < 1000) break;
  }
  if (ACTIVE_ONLY) sets = sets.filter((s) => s.status === 'active');
  const agg = {};
  for (const s of sets) { const k = 'lv' + s.level + '/' + s.status; agg[k] = (agg[k] || 0) + 1; }
  console.log('exam_id NULL sets to backfill:', sets.length, ACTIVE_ONLY ? '(active only)' : '(all)', APPLY ? '(APPLY)' : '(DRY-RUN)');
  Object.keys(agg).sort().forEach((k) => console.log('  ', k, agg[k]));
  const unknown = sets.filter((s) => !L2E[s.level]);
  if (unknown.length) console.log('  ⚠ levels with no exam mapping:', [...new Set(unknown.map((s) => s.level))]);
  if (!APPLY) { console.log('DRY-RUN — no writes'); return; }
  let done = 0;
  for (const lvl of Object.keys(L2E)) {
    const ids = sets.filter((s) => String(s.level) === lvl).map((s) => s.id);
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await db.from('question_sets').update({ exam_id: L2E[lvl] }).in('id', ids.slice(i, i + 200));
      if (error) { console.log('ERR lv' + lvl, error.message); break; }
      done += ids.slice(i, i + 200).length;
    }
  }
  console.log('backfilled:', done);
})();
