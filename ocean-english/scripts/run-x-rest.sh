#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== [D] 选词+匹配+语法 · $(date) ==="
for lv in 3 4; do echo "--D banked lv$lv--"; npx tsx scripts/gen-banked.ts $lv 44 --apply --active 2>&1 | tail -1; done
for lv in 3 4 5; do echo "--D match lv$lv--"; npx tsx scripts/gen-paramatch.ts $lv 40 --apply --active 2>&1 | tail -1; done
echo "--D grammar lv2--"; npx tsx scripts/gen-grammar.ts 2 50 --apply --active 2>&1 | tail -1
echo "=== [D] DONE $(date) ==="
