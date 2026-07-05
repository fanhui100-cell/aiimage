#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
until grep -q "\[C\] DONE" "/c/Users/fanhu/AppData/Local/Temp/claude/d--ai-studio/a4ebb3f1-ad9d-489e-be82-fbe4aecfe6af/tasks/b0wpnagpe.output" 2>/dev/null; do sleep 30; done
echo "=== [C2] 完形+七选五 +120 · $(date) ==="
for lv in 1 2 5; do echo "--C2 cloze lv$lv--"; npx tsx scripts/gen-cloze.ts $lv 120 --apply --active 2>&1 | tail -1; done
for lv in 1 2 5; do echo "--C2 7sel lv$lv--"; npx tsx scripts/gen-sevenselect.ts $lv 120 --apply --active 2>&1 | tail -1; done
echo "=== [C2] DONE $(date) ==="
