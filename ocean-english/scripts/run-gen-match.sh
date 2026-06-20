#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== 长篇匹配 gen · CET-4(3)/CET-6(4)/考研(5) x14篇 · $(date) ==="
for lv in 3 4 5; do
  echo "----- match level $lv -----"
  npx tsx scripts/gen-paramatch.ts $lv 14 --apply --active 2>&1 | tail -2
done
echo "=== MATCH ALL DONE $(date) ==="
