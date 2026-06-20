/* ════════════════════════════════════════════════════════════════════════
   export-mock-papers.ts — 为 5 档各导出 1 套「样卷」Markdown（供人工审阅结构与质量）
   从 /api/mock-exam 取装配好的整卷（题目全部本项目原创），渲染成可读 md 到 reports/mock-papers/。
   用法：npx tsx scripts/export-mock-papers.ts   （需 dev server 在 3137）
   ════════════════════════════════════════════════════════════════════════ */
import { writeFileSync, mkdirSync } from 'fs'
const BASE = 'http://localhost:3137'
const EXAMS = ['zhongkao', 'gaokao', 'cet4', 'cet6', 'kaoyan']
const LET = 'ABCDEFGHIJKLMN'

type Q = { id: string; type: string; normalized_word: string | null; prompt: string | null; prompt_zh: string | null; choices: { id: string; text: string }[] | null; answer: string | null; answer_text: string | null; hint: any; audio_ref: string | null; explanation_zh: string | null }

function renderChoiceQ(q: Q, n: number): string {
  const opts = (q.choices ?? []).map(c => `${c.id.toUpperCase()}. ${c.text}`).join('   ')
  return `**${n}.** ${q.prompt ?? ''}\n   ${opts}\n   ✅ ${String(q.answer ?? '').toUpperCase()}${q.explanation_zh ? ` · ${q.explanation_zh}` : ''}\n`
}
function renderPassageGroup(qs: Q[], startN: number): string {
  // 阅读/听力：同篇 audio_ref 的题归在短文下
  const passage = String(qs[0]?.audio_ref ?? '')
  let out = `> ${passage.slice(0, 600)}${passage.length > 600 ? '…' : ''}\n\n`
  qs.forEach((q, i) => { out += renderChoiceQ(q, startN + i) })
  return out + '\n'
}
function renderClozePassage(q: Q): string {
  const blanks = (q.hint?.blanks ?? []) as { options: string[]; answer: number; explain?: string }[]
  let out = `> ${String(q.audio_ref ?? '').slice(0, 700)}\n\n`
  blanks.forEach((b, i) => { out += `(${i + 1}) ${b.options.map((o, k) => `${LET[k]}.${o}`).join('  ')}  → ✅${LET[b.answer] ?? '?'}\n` })
  return out + '\n'
}
function renderBanked(q: Q): string {
  const bank = (q.hint?.bank ?? []) as string[]; const ans = (q.hint?.answers ?? []) as number[]
  return `> ${String(q.audio_ref ?? '').slice(0, 600)}\n\n词库: ${bank.map((w, i) => `${LET[i]}.${w}`).join('  ')}\n答案(各空): ${ans.map(a => LET[a] ?? '?').join(' ')}\n\n`
}
function renderParaMatch(q: Q): string {
  const st = (q.hint?.statements ?? []) as string[]; const ans = (q.hint?.answers ?? []) as number[]
  let out = `> [长篇，${q.hint?.paras ?? '?'} 段]\n\n`
  st.forEach((s, i) => { out += `${i + 1}. ${s}  → 段 ${LET[ans[i]] ?? '?'}\n` })
  return out + '\n'
}
function renderGrammar(q: Q): string {
  const gb = (q.hint?.gblanks ?? []) as { answer: string }[]
  return `> ${String(q.audio_ref ?? '').slice(0, 600)}\n\n答案: ${gb.map((b, i) => `(${i + 1})${b.answer}`).join('  ')}\n\n`
}

async function main() {
  mkdirSync('reports/mock-papers', { recursive: true })
  for (const exam of EXAMS) {
    const res = await fetch(`${BASE}/api/mock-exam?exam=${exam}&seed=42`)
    const j = await res.json() as any
    if (!j.ok) { console.log(exam, 'ERR', j.error); continue }
    const d = j.data
    let md = `# ${d.zh}\n\n`
    md += `> 对应考试：${d.cnExam} · 客观题 ${d.objectivePoints} 分 / 真卷满分 ${d.fullPoints} 分 · 建议 ${d.minutes} 分钟\n`
    md += `> 未含主观题：${d.skipped.join('、')}\n`
    md += `> ⚠️ 全部题目为本项目**原创/AI 生成**（非真题），按真实考试结构装配。\n\n`
    let n = 1
    for (const sec of d.sections) {
      md += `## ${sec.label} · ${sec.en}（${sec.points} 分，${sec.questions.length} 题/项）\n\n`
      const qs = sec.questions as Q[]
      if (!qs.length) { md += `（该档暂无可用题）\n\n`; continue }
      const t = sec.type
      if (t === 'reading_comprehension' || t === 'listening_comprehension') {
        // 按篇分组
        const byP = new Map<string, Q[]>()
        for (const q of qs) { const p = String(q.normalized_word ?? q.id); if (!byP.has(p)) byP.set(p, []); byP.get(p)!.push(q) }
        let pi = 1
        for (const [, g] of byP) { md += `**第 ${pi} 篇**\n\n` + renderPassageGroup(g, n); n += g.length; pi++ }
      } else if (t === 'cloze_passage') { qs.forEach(q => { md += renderClozePassage(q) }) }
      else if (t === 'banked_cloze') { qs.forEach(q => { md += renderBanked(q) }) }
      else if (t === 'para_match') { qs.forEach(q => { md += renderParaMatch(q) }) }
      else if (t === 'grammar_fill') { qs.forEach(q => { md += renderGrammar(q) }) }
      else if (t === 'seven_select') { qs.forEach(q => { md += renderBanked(q) }) }
      else { qs.forEach(q => { md += renderChoiceQ(q, n); n++ }) }
      md += '\n'
    }
    const f = `reports/mock-papers/${exam}.md`
    writeFileSync(f, md)
    console.log(`${exam}: ${d.totalQuestions} 题 → ${f}`)
  }
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
