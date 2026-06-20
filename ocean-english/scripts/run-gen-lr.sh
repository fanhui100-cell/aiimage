#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== batch gen listening+reading · 7 levels x 16 passages · $(date) ==="
for lv in 1 2 3 4 5 6 7; do
  echo "----- LEVEL $lv listening -----"
  npx tsx scripts/gen-listening.ts $lv 16 --apply --active 2>&1 | tail -3
  echo "----- LEVEL $lv reading -----"
  npx tsx scripts/gen-reading.ts $lv 16 --apply --active 2>&1 | tail -3
done
echo "=== ALL DONE $(date) ==="
