#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
until grep -q "\[A\] DONE" "/c/Users/fanhu/AppData/Local/Temp/claude/d--ai-studio/a4ebb3f1-ad9d-489e-be82-fbe4aecfe6af/tasks/bogrntphn.output" 2>/dev/null; do sleep 30; done
echo "=== [A2] 听力 +240/档 · $(date) ==="
for lv in 1 2 3 4 5 6 7; do echo "--A2 lv$lv--"; npx tsx scripts/gen-listening.ts $lv 240 --apply --active 2>&1 | tail -1; done
echo "=== [A2] DONE $(date) ==="
