#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== 完形填空(整篇) gen · 中考(1)/高考(2)/考研(5) x20篇 · $(date) ==="
for lv in 1 2 5; do
  echo "----- cloze level $lv -----"
  npx tsx scripts/gen-cloze.ts $lv 20 --apply --active 2>&1 | tail -2
done
echo "=== CLOZE ALL DONE $(date) ==="
