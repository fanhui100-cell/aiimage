#!/usr/bin/env bash
cd /d/ai-studio/ocean-english
echo "=== 语法填空 gen · 高考(2) x20篇 · $(date) ==="
npx tsx scripts/gen-grammar.ts 2 20 --apply --active 2>&1 | tail -2
echo "=== GRAMMAR ALL DONE $(date) ==="
