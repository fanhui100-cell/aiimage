#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== [C] 完形+七选五 ×44 · $(date) ==="
for lv in 1 2 5; do echo "--C cloze lv$lv--"; npx tsx scripts/gen-cloze.ts $lv 44 --apply --active 2>&1 | tail -1; done
for lv in 1 2 5; do echo "--C 7sel lv$lv--"; npx tsx scripts/gen-sevenselect.ts $lv 44 --apply --active 2>&1 | tail -1; done
echo "=== [C] DONE $(date) ==="
