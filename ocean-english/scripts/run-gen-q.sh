#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== rule-layer regen (synonym_substitute etc.; antonym_choice retired · Phase 11) levels 1,2,4,5,6,7 · $(date) ==="
for lv in 1 2 4 5 6 7; do
  echo "----- gen-questions level $lv -----"
  npx tsx scripts/gen-questions.ts $lv 2>&1 | tail -1
done
echo "=== GENQ ALL DONE $(date) ==="
