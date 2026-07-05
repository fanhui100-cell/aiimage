#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== [A] 听力 ×60/档 · $(date) ==="
for lv in 1 2 3 4 5 6 7; do echo "--A lv$lv--"; npx tsx scripts/gen-listening.ts $lv 60 --apply --active 2>&1 | tail -1; done
echo "=== [A] DONE $(date) ==="
