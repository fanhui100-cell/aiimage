#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== 七选五 gen · 中考(1)/高考(2)/考研(5) x18篇 · $(date) ==="
for lv in 1 2 5; do
  echo "----- 7sel level $lv -----"
  npx tsx scripts/gen-sevenselect.ts $lv 18 --apply --active 2>&1 | tail -2
done
echo "=== 7SEL ALL DONE $(date) ==="
