/* ════════════════════════════════════════════════════════════════════════
   validate-question-type-taxonomy.ts — Phase 0A/0B 题型分类不变量校验。

   失败（非零退出码）条件：
   [0A]
   - DEPRECATED_QUESTION_TYPES 未包含 antonym_choice 和 cet_cloze
   - ALIAS_ONLY_QUESTION_TYPES 未包含 definition_to_word / zh_definition_to_word / listen_to_word
   - WORD_UNIVERSE_TYPES 未包含 def_to_word
   - lib/mock-exam/paper-specs.ts 的 section 候选题型仍含 cet_cloze
   - lib/mock-exam/paper-specs.ts 含 antonym_choice
   [0B]
   - components/screens/drill/drill-data.ts 可见 TYPES 仍含 antonym_choice 或 cet_cloze
   - components/screens/drill/drill-data.ts PAPER_SPECS section 候选数组含 cet_cloze 或 antonym_choice
   - components/quiz/LexiverseQuizClient.tsx 的 DRILL_TYPE_MAP 含 antonym_choice 或 cet_cloze
     （mapBankRow() 中明确标注 legacy-only 的 cet_cloze 兼容路径不计入）
   ════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  ALIAS_ONLY_QUESTION_TYPES,
  DEPRECATED_QUESTION_TYPES,
  WORD_UNIVERSE_TYPES,
} from '@/lib/question-bank/question-type-taxonomy'
import { MOCK_PAPER_SPECS } from '@/lib/mock-exam/paper-specs'
import {
  TYPES as DRILL_VISIBLE_TYPES,
  PAPER_SPECS as DRILL_PAPER_SPECS,
} from '@/components/screens/drill/drill-data'

const errors: string[] = []

const deprecated = new Set<string>(DEPRECATED_QUESTION_TYPES)
const aliasOnly = new Set<string>(ALIAS_ONLY_QUESTION_TYPES)
const wordUniverse = new Set<string>(WORD_UNIVERSE_TYPES)

// ── [0A] taxonomy 集合成员 ────────────────────────────────────────────────
// 1) 退役集合必含 antonym_choice / cet_cloze
for (const t of ['antonym_choice', 'cet_cloze']) {
  if (!deprecated.has(t)) errors.push(`DEPRECATED_QUESTION_TYPES 缺少 "${t}"`)
}

// 2) 仅别名集合必含三个历史别名
for (const t of ['definition_to_word', 'zh_definition_to_word', 'listen_to_word']) {
  if (!aliasOnly.has(t)) errors.push(`ALIAS_ONLY_QUESTION_TYPES 缺少 "${t}"`)
}

// 3) def_to_word 必在单词宇宙集合
if (!wordUniverse.has('def_to_word')) {
  errors.push('WORD_UNIVERSE_TYPES 缺少 "def_to_word"')
}

// ── [0A] 后端 mock paper specs ───────────────────────────────────────────
// 4/5) 模拟卷 section 候选题型不得含 cet_cloze / antonym_choice
for (const spec of MOCK_PAPER_SPECS) {
  for (const section of spec.sections) {
    for (const t of section.types) {
      if (t === 'cet_cloze') errors.push(`paper-specs ${spec.exam}/${section.key} 仍含 section 候选题型 "cet_cloze"`)
      if (t === 'antonym_choice') errors.push(`paper-specs ${spec.exam}/${section.key} 含 "antonym_choice"`)
    }
  }
}

// ── [0B] 前端可见题型数据 drill-data.ts ──────────────────────────────────
// 6) 可见 TYPES 不得含退役题型
for (const t of DRILL_VISIBLE_TYPES) {
  if (t.key === 'antonym_choice' || t.key === 'cet_cloze') {
    errors.push(`drill-data 可见 TYPES 仍含退役题型 "${t.key}"`)
  }
}

// 7) 前端 PAPER_SPECS section 候选数组不得含退役题型
for (const spec of DRILL_PAPER_SPECS) {
  for (const section of spec.sections) {
    for (const t of section.types) {
      if (t === 'cet_cloze') errors.push(`drill-data PAPER_SPECS ${spec.exam}/${section.key} 仍含 "cet_cloze"`)
      if (t === 'antonym_choice') errors.push(`drill-data PAPER_SPECS ${spec.exam}/${section.key} 含 "antonym_choice"`)
    }
  }
}

// ── [0B] /quiz DRILL_TYPE_MAP（文本块扫描，放行 mapBankRow legacy-only 路径）──
const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const quizSrc = readFileSync(resolve(root, 'components/quiz/LexiverseQuizClient.tsx'), 'utf8')
const mapBlock = quizSrc.match(/const DRILL_TYPE_MAP[\s\S]*?\n\}/)?.[0] ?? ''
if (!mapBlock) {
  errors.push('未能在 LexiverseQuizClient.tsx 定位 DRILL_TYPE_MAP 块')
} else {
  if (/\bantonym_choice\b/.test(mapBlock)) errors.push('LexiverseQuizClient DRILL_TYPE_MAP 仍含 "antonym_choice"')
  if (/\bcet_cloze\b/.test(mapBlock)) errors.push('LexiverseQuizClient DRILL_TYPE_MAP 仍含 "cet_cloze"')
}

console.log('question-type taxonomy validation')
console.log(`  word universe types: ${WORD_UNIVERSE_TYPES.length}`)
console.log(`  deprecated types:    ${DEPRECATED_QUESTION_TYPES.join(', ')}`)
console.log(`  alias-only types:    ${ALIAS_ONLY_QUESTION_TYPES.join(', ')}`)
console.log(`  mock paper specs:    ${MOCK_PAPER_SPECS.length}`)
console.log(`  drill visible types: ${DRILL_VISIBLE_TYPES.length}`)
console.log(`  drill paper specs:   ${DRILL_PAPER_SPECS.length}`)
console.log(`  errors: ${errors.length}`)
for (const error of errors) console.error(`ERROR ${error}`)

if (errors.length > 0) {
  process.exit(1)
}

console.log('taxonomy ok')
