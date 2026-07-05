/* ════════════════════════════════════════════════════════════════════════
   smoke-ai-scoring.ts — 产出型 AI 估分接线冒烟（无 DB/无 key，确定性 mock）

   1) scoringSkillForTask 单一真源映射：写作/翻译/口语任务 → 正确技能；非生产性 → null。
   2) 三技能 forceMock 评分形状：provider='mock'、isEstimate=true、overall∈[0,fullScore]、
      band 非空、dimensions 覆盖全 rubric 维度且 0≤awarded≤max（max>0）。
   3) 复刻 PracticeRunner.toEstimate 的维度归一：每维 v∈[0,100]。
   只读、纯函数，不触网络/不写库。
   ════════════════════════════════════════════════════════════════════════ */
import { scoringSkillForTask, getRubric } from '@/lib/scoring/rubrics'
import { scoreWriting } from '@/lib/scoring/score-writing'
import { scoreTranslation } from '@/lib/scoring/score-translation'
import { scoreSpeaking } from '@/lib/scoring/score-speaking'
import type { SubjectiveScore } from '@/lib/scoring/rubric-types'

let failures = 0
const check = (c: boolean, m: string) => { if (c) console.log('  ✓', m); else { console.log('  ✗', m); failures++ } }

function assertScore(label: string, examId: string, skill: 'writing' | 'translation' | 'speaking', r: SubjectiveScore | { error: string }) {
  console.log(`\n## ${label} (${examId}:${skill})`)
  if ('error' in r) { check(false, `评分返回错误: ${r.error}`); return }
  const rubric = getRubric(examId, skill)!
  check(r.provider === 'mock', `provider=mock（forceMock）`)
  check(r.isEstimate === true, `isEstimate=true（估分非官方分）`)
  check(typeof r.overall === 'number' && r.overall >= 0 && r.overall <= r.fullScore, `overall∈[0,${r.fullScore}]（=${r.overall}）`)
  check(typeof r.band === 'string' && r.band.length > 0, `band 非空（${r.band}）`)
  check(r.dimensions.length === rubric.dimensions.length, `维度数=rubric（${r.dimensions.length}/${rubric.dimensions.length}）`)
  check(r.dimensions.every((d) => d.max > 0 && d.awarded >= 0 && d.awarded <= d.max), `每维 0≤awarded≤max（max>0）`)
  // 复刻 toEstimate：每维归一 0..100
  const vs = r.dimensions.map((d) => (d.max ? Math.round((d.awarded / d.max) * 100) : 0))
  check(vs.every((v) => v >= 0 && v <= 100), `归一进度值 v∈[0,100]（${vs.join('/')}）`)
}

async function main() {
  console.log('smoke-ai-scoring: 产出型 AI 估分接线（mock）')

  console.log('\n## scoringSkillForTask 映射')
  check(scoringSkillForTask('essay_writing') === 'writing', `essay_writing → writing`)
  check(scoringSkillForTask('applied_writing') === 'writing', `applied_writing → writing`)
  check(scoringSkillForTask('continuation_writing') === 'writing', `continuation_writing → writing`)
  check(scoringSkillForTask('email_writing') === 'writing', `email_writing → writing`)
  check(scoringSkillForTask('academic_discussion') === 'writing', `academic_discussion → writing`)
  check(scoringSkillForTask('translation_zh_en') === 'translation', `translation_zh_en → translation`)
  check(scoringSkillForTask('translation_en_zh') === 'translation', `translation_en_zh → translation`)
  check(scoringSkillForTask('interview_speaking') === 'speaking', `interview_speaking → speaking`)
  check(scoringSkillForTask('listen_and_repeat') === 'speaking', `listen_and_repeat → speaking`)
  check(scoringSkillForTask('reading_comprehension') === null, `reading_comprehension → null（非生产性）`)
  check(scoringSkillForTask('') === null, `空 taskType → null`)

  assertScore('CET-4 写作', 'cet4', 'writing',
    await scoreWriting({ examId: 'cet4', text: 'Nowadays more and more students choose to study abroad for various reasons. In my opinion, this trend brings both opportunities and challenges that deserve careful consideration.', taskType: 'essay_writing' }, { forceMock: true }))
  assertScore('CET-4 翻译', 'cet4', 'translation',
    await scoreTranslation({ examId: 'cet4', text: 'The Spring Festival is the most important traditional festival in China.', sourceText: '春节是中国最重要的传统节日。', taskType: 'translation_zh_en' }, { forceMock: true }))
  assertScore('TOEFL 口语', 'toefl', 'speaking',
    await scoreSpeaking({ examId: 'toefl', text: 'I prefer studying in a group because we can share different ideas and help each other understand difficult concepts.', taskType: 'interview_speaking' }, { forceMock: true }))

  console.log(failures === 0 ? '\nsmoke-ai-scoring PASS' : `\nsmoke-ai-scoring FAIL（${failures}）`)
  if (failures) process.exitCode = 1
}
main().catch((e) => { console.error('fatal', e?.message ?? e); process.exit(1) })
