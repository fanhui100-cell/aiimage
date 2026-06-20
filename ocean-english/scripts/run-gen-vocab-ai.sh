#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
# 旧 v1 question_bank 生成包装：仅 collocation_choice（antonym_choice 已退役 · Phase 11）。
# 默认写 draft（不再默认 --active）；需上架请人工核验后单独加 --active 重跑。
echo "=== AI vocab (collocation only · draft) 7 levels x 48 words · $(date) ==="
for lv in 1 2 3 4 5 6 7; do
  echo "----- vocab-ai level $lv -----"
  npx tsx scripts/gen-vocab-ai.ts $lv 48 --apply 2>&1 | tail -2
done
echo "=== VOCAB-AI ALL DONE $(date) ==="
