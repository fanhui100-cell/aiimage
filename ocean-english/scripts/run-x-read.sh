#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== [B] 阅读 ×60/档 · $(date) ==="
for lv in 1 2 3 4 5 6 7; do echo "--B lv$lv--"; npx tsx scripts/gen-reading.ts $lv 60 --apply --active 2>&1 | tail -1; done
echo "=== [B] DONE $(date) ==="
