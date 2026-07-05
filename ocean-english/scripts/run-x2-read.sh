#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
until grep -q "\[B\] DONE" "/c/Users/fanhu/AppData/Local/Temp/claude/d--ai-studio/a4ebb3f1-ad9d-489e-be82-fbe4aecfe6af/tasks/bxupbwh3d.output" 2>/dev/null; do sleep 30; done
echo "=== [B2] 阅读 +240/档 · $(date) ==="
for lv in 1 2 3 4 5 6 7; do echo "--B2 lv$lv--"; npx tsx scripts/gen-reading.ts $lv 240 --apply --active 2>&1 | tail -1; done
echo "=== [B2] DONE $(date) ==="
