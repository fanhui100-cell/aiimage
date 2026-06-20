#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
until grep -q "\[D\] DONE" "/c/Users/fanhu/AppData/Local/Temp/claude/d--ai-studio/a4ebb3f1-ad9d-489e-be82-fbe4aecfe6af/tasks/bqz4x37j2.output" 2>/dev/null; do sleep 30; done
echo "=== [D2] 选词+匹配+语法 · $(date) ==="
for lv in 3 4; do echo "--D2 banked lv$lv--"; npx tsx scripts/gen-banked.ts $lv 110 --apply --active 2>&1 | tail -1; done
for lv in 3 4 5; do echo "--D2 match lv$lv--"; npx tsx scripts/gen-paramatch.ts $lv 110 --apply --active 2>&1 | tail -1; done
echo "--D2 grammar lv2--"; npx tsx scripts/gen-grammar.ts 2 160 --apply --active 2>&1 | tail -1
echo "=== [D2] DONE $(date) ==="
