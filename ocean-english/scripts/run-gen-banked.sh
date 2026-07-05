#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== 选词填空 gen · CET-4(3)/CET-6(4) x16篇 · $(date) ==="
for lv in 3 4; do
  echo "----- banked level $lv -----"
  npx tsx scripts/gen-banked.ts $lv 16 --apply --active 2>&1 | tail -2
done
echo "=== BANKED ALL DONE $(date) ==="
