'use client'
/* ============================================================================
   LexiGraphScreen — 阶段4：LexiGraph 重做（照 prototypes/lexigraph-redesign 移植）
   语义图谱：中心词 radial（内环词形+后缀标签，外环近义/反义/易混/搭配四扇区）
   记忆图谱：节点=学习词（大小=复习次数，颜色=记忆强度），边=语义+共同出错
   数据：dictionary API + word_relations + lexiStore（原型 mock 全部换真）
   ============================================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, STATE_COLOR_DARK } from '@/lib/state-meta'

/* ── 状态色（P5-B1：唯一来源 STATE_META 暗色变体）────────────────────────── */
const STATE_COLORS: Record<string, string> = STATE_COLOR_DARK
const STATE_ZH: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_META).map(([k, v]) => [k, v.zh]))
const TYPE_META: Record<string, { color: string; zh: string; en: string; r: number; c: number; spread: number }> = {
  form:  { color: '#4fe6ce', zh: '词形', en: 'MORPHOLOGY',  r: 165, c: -Math.PI / 2, spread: Math.PI * 0.78 },
  syn:   { color: '#4fe6a0', zh: '近义', en: 'SYNONYM',     r: 295, c: -0.25, spread: 0.9 },
  ant:   { color: '#6da7ff', zh: '反义', en: 'ANTONYM',     r: 295, c: 0.85, spread: 0.7 },
  conf:  { color: '#f2879e', zh: '易混', en: 'CONFUSABLE',  r: 295, c: 2.0, spread: 0.5 },
  collo: { color: '#e8b04b', zh: '搭配', en: 'COLLOCATION', r: 300, c: Math.PI + 0.35, spread: 0.95 },
}
// 记忆强度色（设计规格：过期红/即将到期黄/interval≥16 绿/学习中 teal/未开始灰）
const MEM = { overdue: '#f2879e', soon: '#e8b04b', strong: '#4fe6a0', active: '#4fe6ce', idle: '#8a97a1' }

interface GNode {
  key: string; label: string; type: string
  tx: number; ty: number; x: number; y: number; a: number
  zh?: string; suf?: string; fpos?: string; phrase?: boolean
  state?: string | null; phon?: string
  // 记忆图谱
  memColor?: string; size?: number; wordId?: string
}
interface GEdge { from: string; toKey: string; type: string; suf?: string; weight?: number }

interface CenterData {
  zh: string; phon: string; pos: string; lv: string
  forms: { w: string; suf: string; fpos: string; zh: string }[]
  syn: string[]; ant: string[]
  conf: { w: string; hint: string }[]
  collo: { phrase: string; zh: string }[]
  wordsMeta: Record<string, { zh: string; phon: string }>
}

const LV_ZH: Record<number, string> = { 1: '初中', 2: '高中', 3: '四级', 4: '六级', 5: '考研', 6: '托福', 7: 'SAT' }
const FIRST_VISIT_KEY = 'lexigraph-v2-intro-seen'

/* ── 数据装配：dictionary + word_relations → 原型 D[w] 结构 ────────────────── */
async function loadCenterData(slug: string): Promise<CenterData | null> {
  try {
    const [dictRes, relRes] = await Promise.all([
      fetch(`/api/dictionary/word/${encodeURIComponent(slug)}`),
      fetch(`/api/dictionary/relations?word=${encodeURIComponent(slug)}`),
    ])
    const dict = dictRes.ok ? (await dictRes.json()).data : null
    const rel = relRes.ok ? (await relRes.json()).data : { root: null, relations: [], words: {} }
    if (!dict && !rel.relations.length) return null

    const def = dict?.definitions?.[0]
    const meta: CenterData = {
      zh: def?.definitionZh ?? def?.definitionEn ?? '',
      phon: dict?.phoneticIpa ?? rel.words[slug]?.phon ?? '',
      pos: def?.partOfSpeech ?? dict?.partOfSpeech ?? '',
      lv: dict?.primaryLevel ? (LV_ZH[dict.primaryLevel] ?? '') : (rel.words[slug]?.levels?.length ? LV_ZH[Math.min(...rel.words[slug].levels)] ?? '' : ''),
      forms: [], syn: [], ant: [], conf: [], collo: [],
      wordsMeta: {},
    }
    for (const [k, v] of Object.entries(rel.words as Record<string, { zh: string; phon: string }>)) {
      meta.wordsMeta[k] = { zh: v.zh, phon: v.phon }
    }

    const root: string | null = rel.root
    for (const r of rel.relations as { type: string; a: string; b: string; note: string | null }[]) {
      const other = r.a === slug ? r.b : r.a
      if (other === slug) continue
      switch (r.type) {
        case 'derivative': {
          // 词根词显示自己的派生；派生词显示词根+兄弟（FORM_PARENT 反查已由 API root 完成）
          const isMine = r.a === slug || (root != null && r.a === root)
          if (!isMine) break
          const target = r.b === slug ? r.a : r.b
          if (target === slug) break
          const stem = r.note ?? ''
          const suf = target === root ? '词根'
            : stem && target.startsWith(stem.slice(0, 4)) ? '+' + target.slice(stem.length) : '·'
          if (!meta.forms.some(f => f.w === target)) {
            meta.forms.push({ w: target, suf, fpos: '', zh: meta.wordsMeta[target]?.zh ?? '' })
          }
          break
        }
        case 'synonym': case 'synonym-candidate':
          if (!meta.syn.includes(other)) meta.syn.push(other)
          break
        case 'antonym':
          if (!meta.ant.includes(other)) meta.ant.push(other)
          break
        case 'confusable-form': case 'confused':
          if (!meta.conf.some(c => c.w === other)) meta.conf.push({ w: other, hint: r.note ?? '形近易混' })
          break
        case 'collocation':
          if (!meta.collo.some(c => c.phrase === other)) meta.collo.push({ phrase: other, zh: r.note ?? '' })
          break
      }
    }
    // 词根放词形首位
    if (root && root !== slug) {
      meta.forms = [
        { w: root, suf: '词根', fpos: '', zh: meta.wordsMeta[root]?.zh ?? '' },
        ...meta.forms.filter(f => f.w !== root),
      ]
    }
    meta.forms = meta.forms.slice(0, 8)
    meta.syn = meta.syn.slice(0, 6)
    meta.ant = meta.ant.slice(0, 4)
    meta.conf = meta.conf.slice(0, 4)
    // 搭配：词库 phrases（阶段2 注入）优先补足
    for (const p of (dict?.phrases ?? []) as { phrase: string; translation?: string }[]) {
      if (meta.collo.length >= 5) break
      if (!meta.collo.some(c => c.phrase === p.phrase)) meta.collo.push({ phrase: p.phrase, zh: p.translation ?? '' })
    }
    return meta
  } catch { return null }
}

/* ── 记忆强度派生 ──────────────────────────────────────────────────────────── */
function memColorOf(w: WordEntry, now: number): string {
  if (w.state === 'recommended' || w.state === 'unknown') return MEM.idle
  if (w.nextReviewAt != null && w.nextReviewAt < now) return MEM.overdue
  if (w.nextReviewAt != null && w.nextReviewAt - now < 48 * 3600_000) return MEM.soon
  if ((w.interval ?? 0) >= 16) return MEM.strong
  return MEM.active
}

/* ════════════════════════════ 主组件 ═══════════════════════════════════════ */
export function LexiGraphScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeWords = useLexiStore(s => s.words)
  const quizHistory = useLexiStore(s => s.quizHistory)

  const [mode, setMode] = useState<'semantic' | 'memory'>('semantic')
  const [center, setCenter] = useState<string | null>(null)
  const [centerData, setCenterData] = useState<CenterData | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, boolean>>({ form: true, syn: true, ant: true, conf: true, collo: true })
  const [searchQ, setSearchQ] = useState('')
  const [searchHits, setSearchHits] = useState<{ id: string; word: string; zh: string }[]>([])
  const [compare, setCompare] = useState<{ a: string; b: string; count: number } | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [intro, setIntro] = useState(false)
  const [toast, setToast] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    nodes: [] as GNode[], edges: [] as GEdge[], anim: 0,
    cam: { x: 40, y: 0, s: 1, tx: 40, ty: 0, ts: 1 },
    hover: null as GNode | null, t: 0,
    sprites: {} as Record<string, HTMLCanvasElement>,
    bg: [] as { x: number; y: number; sz: number; tw: number }[],
    drag: null as { x: number; y: number; cx: number; cy: number } | null,
  })
  const dataRef = useRef<{ centerData: CenterData | null; storeWords: WordEntry[]; mode: string; filters: Record<string, boolean> }>(
    { centerData: null, storeWords: [], mode: 'semantic', filters })
  dataRef.current = { centerData, storeWords, mode, filters }

  const wordStateOf = useCallback((slug: string): string | null =>
    storeWords.find(w => w.id === slug)?.state ?? null, [storeWords])

  /* ── 初始中心词：?word= > 最近学习词 > 演示词 ─────────────────────────────── */
  useEffect(() => {
    if (center) return
    const q = searchParams.get('word')
    const recent = [...storeWords].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))[0]
    setCenter(q?.toLowerCase() || recent?.id || 'accept')
    if (typeof window !== 'undefined' && !localStorage.getItem(FIRST_VISIT_KEY)) setIntro(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  /* ── 中心词数据加载 + 建图（语义模式）────────────────────────────────────── */
  useEffect(() => {
    if (!center || mode !== 'semantic') return
    let cancelled = false
    loadCenterData(center).then(d => {
      if (cancelled) return
      setCenterData(d)
      buildSemanticGraph(center, d)
      setPanelOpen(true)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, mode])

  const buildSemanticGraph = useCallback((w: string, d: CenterData | null) => {
    const st = stateRef.current
    const old = Object.fromEntries(st.nodes.map(n => [n.key, n]))
    const nodes: GNode[] = []
    const edges: GEdge[] = []
    const add = (key: string, label: string, type: string, tx: number, ty: number, extra: Partial<GNode> = {}) => {
      const prev = old[key]
      nodes.push({ key, label, type, tx, ty, x: prev ? prev.x : tx * 1.6, y: prev ? prev.y : ty * 1.6, a: prev ? 1 : 0, ...extra })
    }
    add(w, w, 'center', 0, 0, { zh: d?.zh ?? '' })
    const ring = (list: { word: string; suf?: string; fpos?: string; zh?: string; phrase?: boolean }[], type: string) => {
      if (!list.length) return
      const m = TYPE_META[type]
      list.forEach((item, i) => {
        const n = list.length
        const ang = m.c + (n === 1 ? 0 : (i / (n - 1) - 0.5) * m.spread)
        const r = m.r + (i % 2) * 26
        add(type + '_' + item.word, item.word, type, Math.cos(ang) * r, Math.sin(ang) * r, {
          suf: item.suf, fpos: item.fpos, zh: item.zh, phrase: item.phrase,
          state: item.phrase ? null : wordStateOf(item.word),
        })
        edges.push({ from: w, toKey: type + '_' + item.word, type, suf: item.suf })
      })
    }
    if (d) {
      ring(d.forms.map(f => ({ word: f.w, suf: f.suf, fpos: f.fpos, zh: f.zh })), 'form')
      ring(d.syn.map(s => ({ word: s, zh: d.wordsMeta[s]?.zh })), 'syn')
      ring(d.ant.map(s => ({ word: s, zh: d.wordsMeta[s]?.zh })), 'ant')
      ring(d.conf.map(c => ({ word: c.w, zh: d.wordsMeta[c.w]?.zh ?? c.hint })), 'conf')
      ring(d.collo.map(c => ({ word: c.phrase, zh: c.zh, phrase: true })), 'collo')
    }
    st.nodes = nodes
    st.edges = edges
    st.anim = 0
  }, [wordStateOf])

  /* ── 记忆图谱建图 ─────────────────────────────────────────────────────────── */
  const wrongPairs = useMemo(() => {
    // 共同出错边：同一 session 双错词对，≥2 次才显示；
    // P5-B：之后某 session 两词全对（如辨析题答对）→ 该红边消退
    const pairCount = new Map<string, number>()
    const resolved = new Set<string>()
    const sessions = [...quizHistory].sort((a, b) => (a.completedAt ?? a.startedAt) - (b.completedAt ?? b.startedAt))
    for (const s of sessions) {
      const wrong = [...new Set(s.attempts.filter(a => !a.correct).map(a => a.wordId))]
      const right = [...new Set(s.attempts.filter(a => a.correct).map(a => a.wordId))]
      for (let i = 0; i < wrong.length; i++) {
        for (let j = i + 1; j < wrong.length; j++) {
          const k = [wrong[i], wrong[j]].sort().join('|')
          pairCount.set(k, (pairCount.get(k) ?? 0) + 1)
          resolved.delete(k)            // 又一起错 → 重新点亮
        }
      }
      // 一个 session 里两词都答对 → 视为已辨析清楚
      for (let i = 0; i < right.length; i++) {
        for (let j = i + 1; j < right.length; j++) {
          const k = [right[i], right[j]].sort().join('|')
          if (pairCount.has(k)) resolved.add(k)
        }
      }
    }
    return [...pairCount.entries()].filter(([k, c]) => c >= 2 && !resolved.has(k))
      .map(([k, c]) => ({ a: k.split('|')[0], b: k.split('|')[1], count: c }))
  }, [quizHistory])

  const buildMemoryGraph = useCallback(async () => {
    const st = stateRef.current
    const now = Date.now()
    const ws = dataRef.current.storeWords.filter(w => w.state !== 'locked' && w.state !== 'unknown')
    const N = ws.length
    const nodes: GNode[] = ws.map((w, i) => {
      // 黄金角螺旋初始布局；过期词拉向中央预警区
      const overdue = memColorOf(w, now) === MEM.overdue
      const ring = overdue ? 60 + (i % 3) * 30 : 160 + 16 * Math.sqrt(i)
      const ang = i * 2.39996
      return {
        key: 'mem_' + w.id, label: w.word, type: 'mem', wordId: w.id,
        tx: Math.cos(ang) * ring, ty: Math.sin(ang) * ring * 0.78,
        x: Math.cos(ang) * ring * 1.5, y: Math.sin(ang) * ring * 1.2, a: 0,
        zh: w.zh, memColor: memColorOf(w, now),
        size: 8 + Math.min(10, Math.log((w.streak ?? 0) + 1) * 6),
        state: w.state,
      }
    })
    const edges: GEdge[] = []
    // 共错红边
    const keyOf = (id: string) => 'mem_' + id
    for (const p of wrongPairs) {
      if (nodes.some(n => n.key === keyOf(p.a)) && nodes.some(n => n.key === keyOf(p.b))) {
        edges.push({ from: keyOf(p.a), toKey: keyOf(p.b), type: 'wrong', weight: p.count })
      }
    }
    // 语义边（淡，可关 — 复用 conf filter 开关语义：filters.syn 控制）
    if (N >= 2 && N <= 80) {
      try {
        const res = await fetch('/api/dictionary/relations?words=' + ws.map(w => w.id).join(','))
        const rel = res.ok ? (await res.json()).data : { relations: [] }
        for (const r of rel.relations as { a: string; b: string }[]) {
          if (nodes.some(n => n.key === keyOf(r.a)) && nodes.some(n => n.key === keyOf(r.b))) {
            edges.push({ from: keyOf(r.a), toKey: keyOf(r.b), type: 'sem' })
          }
        }
      } catch { /* 语义边可缺省 */ }
    }
    st.nodes = nodes
    st.edges = edges
    st.anim = 0
  }, [wrongPairs])

  useEffect(() => {
    if (mode === 'memory') { setPanelOpen(false); void buildMemoryGraph() }
    else if (center) { void loadCenterData(center).then(d => { setCenterData(d); buildSemanticGraph(center, d) }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  /* ── 画布引擎（原型 draw 移植）────────────────────────────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const st = stateRef.current
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5)
    let W = 0, H = 0
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight
      cv.width = W * DPR; cv.height = H * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const makeSprite = (color: string) => {
      const s = document.createElement('canvas'); s.width = s.height = 64
      const c = s.getContext('2d')!
      const g = c.createRadialGradient(32, 32, 2, 32, 32, 30)
      g.addColorStop(0, color); g.addColorStop(0.4, color + '77'); g.addColorStop(1, 'transparent')
      c.fillStyle = g; c.fillRect(0, 0, 64, 64)
      return s
    }
    const SP = st.sprites
    for (const [k, v] of Object.entries(STATE_COLORS)) SP[k] = makeSprite(v)
    for (const [k, v] of Object.entries(MEM)) SP['mem_' + k] = makeSprite(v)
    SP.node = makeSprite('#9fb6c4'); SP.center = makeSprite('#4fe6ce')
    if (!st.bg.length) {
      st.bg = Array.from({ length: 120 }, () => ({
        x: (Math.random() - 0.5) * 2200, y: (Math.random() - 0.5) * 1500,
        sz: 0.3 + Math.random() * 1.3, tw: Math.random() * 6.28,
      }))
    }

    const cam = st.cam
    const proj = (x: number, y: number): [number, number] => [W / 2 + (x - cam.x) * cam.s, H / 2 + (y - cam.y) * cam.s]
    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
    }

    let raf = 0, running = true
    const frame = () => {
      if (!running) return
      raf = requestAnimationFrame(frame)
      const { mode: m, filters: F } = dataRef.current
      // P5-B6：reduced-motion → 跳过补间/渐进，直接定格
      const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      st.t += 0.016; st.anim = rm ? 1 : Math.min(1, st.anim + 0.04)
      if (rm) for (const n of st.nodes) { n.x = n.tx; n.y = n.ty; n.a = 1 }
      cam.x += (cam.tx - cam.x) * 0.08; cam.y += (cam.ty - cam.y) * 0.08; cam.s += (cam.ts - cam.s) * 0.08
      const e2 = 1 - Math.pow(1 - st.anim, 3)
      ctx.clearRect(0, 0, W, H)
      const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.75)
      g.addColorStop(0, '#0a1622'); g.addColorStop(1, '#04070c')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      for (const s of st.bg) {
        const [x, y] = proj(s.x * 0.35 + cam.x * 0.65, s.y * 0.35 + cam.y * 0.65)
        ctx.globalAlpha = 0.2 + 0.25 * Math.abs(Math.sin(st.t * 0.6 + s.tw))
        ctx.drawImage(SP.node, x - s.sz * 3, y - s.sz * 3, s.sz * 6, s.sz * 6)
      }
      ctx.globalAlpha = 1
      for (const n of st.nodes) { n.x += (n.tx - n.x) * 0.1; n.y += (n.ty - n.y) * 0.1; n.a = Math.min(1, n.a + 0.05) }

      if (m === 'semantic') {
        const cn = st.nodes[0]
        if (!cn) return
        const [cx, cy] = proj(cn.x, cn.y)
        // 扇区标签
        for (const [type, meta] of Object.entries(TYPE_META)) {
          if (!F[type] || !st.nodes.some(n => n.type === type)) continue
          const lx = cx + Math.cos(meta.c) * (meta.r + 72) * cam.s, ly = cy + Math.sin(meta.c) * (meta.r + 72) * cam.s
          ctx.globalAlpha = e2 * 0.9; ctx.textAlign = 'center'
          ctx.font = '600 12px "Noto Sans SC"'; ctx.fillStyle = meta.color; ctx.fillText(meta.zh, lx, ly)
          ctx.font = '8.5px "Space Mono"'; ctx.fillStyle = 'rgba(234,243,246,0.3)'; ctx.fillText(meta.en, lx, ly + 13)
        }
        ctx.globalAlpha = 1
        // 边：二次曲线渐进
        for (const ed of st.edges) {
          if (!F[ed.type]) continue
          const n = st.nodes.find(x => x.key === ed.toKey); if (!n) continue
          const [x2, y2] = proj(n.x, n.y)
          const mx = (cx + x2) / 2 - (y2 - cy) * 0.08, my = (cy + y2) / 2 + (x2 - cx) * 0.08
          const meta = TYPE_META[ed.type]
          const hot = st.hover === n || st.hover === cn
          ctx.strokeStyle = meta.color + (hot ? 'cc' : '55'); ctx.lineWidth = hot ? 1.8 : 1.1
          ctx.beginPath(); ctx.moveTo(cx, cy)
          const steps = 14, lim = Math.ceil(steps * e2)
          for (let i = 1; i <= lim; i++) {
            const tt = i / steps
            ctx.lineTo((1 - tt) * (1 - tt) * cx + 2 * (1 - tt) * tt * mx + tt * tt * x2,
              (1 - tt) * (1 - tt) * cy + 2 * (1 - tt) * tt * my + tt * tt * y2)
          }
          ctx.stroke()
          if (ed.type === 'form' && ed.suf && e2 > 0.7) {
            ctx.font = '9px "Space Mono"'; ctx.fillStyle = meta.color
            ctx.globalAlpha = (e2 - 0.7) / 0.3 * 0.9; ctx.textAlign = 'center'
            ctx.fillText(ed.suf, mx, my - 4); ctx.globalAlpha = 1
          }
        }
        // 节点
        for (const n of st.nodes) {
          if (n.type !== 'center' && !F[n.type]) continue
          const [x, y] = proj(n.x, n.y); const hot = st.hover === n
          ctx.globalAlpha = n.a * e2
          if (n.type === 'center') {
            ctx.globalAlpha = 1
            const pulse = 1 + 0.06 * Math.sin(st.t * 2)
            ctx.drawImage(SP.center, x - 46 * pulse, y - 46 * pulse, 92 * pulse, 92 * pulse)
            ctx.font = '500 24px "Space Grotesk"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
            ctx.fillText(n.label, x, y - 2)
            ctx.font = '600 13px "Noto Serif SC"'; ctx.fillStyle = '#4fe6ce'
            ctx.fillText(n.zh ?? '', x, y + 20)
          } else if (n.phrase) {
            ctx.font = '500 11.5px "Space Grotesk"'
            const w2 = ctx.measureText(n.label).width + 22
            ctx.fillStyle = hot ? 'rgba(232,176,75,0.18)' : 'rgba(14,34,48,0.85)'
            ctx.strokeStyle = 'rgba(232,176,75,' + (hot ? '0.8' : '0.4') + ')'; ctx.lineWidth = 1
            roundRect(x - w2 / 2, y - 13, w2, 26, 13); ctx.fill(); ctx.stroke()
            ctx.fillStyle = hot ? '#ffd58f' : 'rgba(234,243,246,0.85)'; ctx.textAlign = 'center'
            ctx.fillText(n.label, x, y + 4)
          } else {
            const col = n.state ? STATE_COLORS[n.state] : null
            const sz = hot ? 13 : 10
            ctx.drawImage(col ? SP[n.state!] ?? SP.node : SP.node, x - sz * 2.4, y - sz * 2.4, sz * 4.8, sz * 4.8)
            ctx.font = (hot ? '600 ' : '500 ') + '13px "Space Grotesk"'
            ctx.fillStyle = hot ? '#fff' : 'rgba(234,243,246,0.88)'; ctx.textAlign = 'center'
            ctx.fillText(n.label, x, y - sz - 7)
            if (n.fpos) { ctx.font = '9px "Space Mono"'; ctx.fillStyle = 'rgba(234,243,246,0.4)'; ctx.fillText(n.fpos, x, y + sz + 14) }
            if (col) { ctx.beginPath(); ctx.arc(x + ctx.measureText(n.label).width / 2 + 8, y - sz - 10, 2.5, 0, 6.28); ctx.fillStyle = col; ctx.fill() }
          }
        }
        ctx.globalAlpha = 1
      } else {
        /* 记忆图谱：边（语义淡 + 共错红粗），节点按记忆强度着色 */
        const find = (k: string) => st.nodes.find(n => n.key === k)
        for (const ed of st.edges) {
          const a = find(ed.from), b = find(ed.toKey)
          if (!a || !b) continue
          if (ed.type === 'sem' && !F.syn) continue
          const [x1, y1] = proj(a.x, a.y), [x2, y2] = proj(b.x, b.y)
          if (ed.type === 'wrong') {
            ctx.strokeStyle = 'rgba(242,135,158,0.85)'
            ctx.lineWidth = Math.min(4, 1 + (ed.weight ?? 1) * 0.8)
          } else {
            ctx.strokeStyle = 'rgba(159,182,196,0.16)'; ctx.lineWidth = 0.8
          }
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
        }
        for (const n of st.nodes) {
          const [x, y] = proj(n.x, n.y); const hot = st.hover === n
          ctx.globalAlpha = n.a * e2
          const sz = (n.size ?? 9) * (hot ? 1.25 : 1)
          const spr = SP['mem_' + Object.entries(MEM).find(([, v]) => v === n.memColor)?.[0]] ?? SP.node
          ctx.drawImage(spr, x - sz * 2.4, y - sz * 2.4, sz * 4.8, sz * 4.8)
          if (cam.s > 0.75 || hot) {
            ctx.font = (hot ? '600 ' : '500 ') + '12px "Space Grotesk"'
            ctx.fillStyle = hot ? '#fff' : 'rgba(234,243,246,0.75)'; ctx.textAlign = 'center'
            ctx.fillText(n.label, x, y - sz - 6)
          }
        }
        ctx.globalAlpha = 1
      }
    }
    raf = requestAnimationFrame(frame)
    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf) }
      else if (!running) { running = true; raf = requestAnimationFrame(frame) }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  /* ── 交互：pick/hover/click/drag/wheel ───────────────────────────────────── */
  const pick = useCallback((mx: number, my: number): GNode | null => {
    const st = stateRef.current
    const W = window.innerWidth, H = window.innerHeight
    const proj = (x: number, y: number) => [W / 2 + (x - st.cam.x) * st.cam.s, H / 2 + (y - st.cam.y) * st.cam.s]
    for (const n of st.nodes) {
      if (n.type !== 'center' && n.type !== 'mem' && !dataRef.current.filters[n.type]) continue
      const [x, y] = proj(n.x, n.y)
      const r = n.type === 'center' ? 44 : n.phrase ? 40 : 22
      if (Math.hypot(mx - x, my - y) < r) return n
    }
    return null
  }, [])

  const [tip, setTip] = useState<{ x: number; y: number; node: GNode } | null>(null)
  // 共错边点击检测（记忆模式）
  const pickWrongEdge = useCallback((mx: number, my: number) => {
    const st = stateRef.current
    if (dataRef.current.mode !== 'memory') return null
    const W = window.innerWidth, H = window.innerHeight
    const proj = (x: number, y: number) => [W / 2 + (x - st.cam.x) * st.cam.s, H / 2 + (y - st.cam.y) * st.cam.s]
    for (const ed of st.edges) {
      if (ed.type !== 'wrong') continue
      const a = st.nodes.find(n => n.key === ed.from), b = st.nodes.find(n => n.key === ed.toKey)
      if (!a || !b) continue
      const [x1, y1] = proj(a.x, a.y), [x2, y2] = proj(b.x, b.y)
      const len2 = (x2 - x1) ** 2 + (y2 - y1) ** 2
      if (!len2) continue
      const t = Math.max(0, Math.min(1, ((mx - x1) * (x2 - x1) + (my - y1) * (y2 - y1)) / len2))
      const d = Math.hypot(mx - (x1 + t * (x2 - x1)), my - (y1 + t * (y2 - y1)))
      if (d < 8) return { a: a.wordId!, b: b.wordId!, count: ed.weight ?? 2 }
    }
    return null
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const st = stateRef.current
    if (st.drag) {
      st.cam.tx = st.drag.cx - (e.clientX - st.drag.x) / st.cam.s
      st.cam.ty = st.drag.cy - (e.clientY - st.drag.y) / st.cam.s
      st.cam.x = st.cam.tx; st.cam.y = st.cam.ty
      return
    }
    const h = pick(e.clientX, e.clientY)
    st.hover = h
    setTip(h && h.type !== 'center' ? { x: e.clientX, y: e.clientY, node: h } : null)
  }, [pick])

  const setCenterWord = useCallback((w: string, push = true) => {
    setCenter(prev => {
      if (push && prev && prev !== w) setHistory(h => [...h, prev])
      return w
    })
  }, [])

  const goBack = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h
      const target = h[h.length - 1]
      setCenter(target)
      return h.slice(0, -1)
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (compare) { setCompare(null); return }
      if (alertOpen) { setAlertOpen(false); return }
      goBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack, compare, alertOpen])

  const onClick = useCallback((e: React.MouseEvent) => {
    const edge = pickWrongEdge(e.clientX, e.clientY)
    if (edge) { setCompare(edge); return }
    const n = pick(e.clientX, e.clientY)
    if (!n || n.phrase) return
    if (n.type === 'center') { setPanelOpen(true); return }
    if (n.type === 'mem') { setMode('semantic'); setCenterWord(n.wordId ?? n.label.toLowerCase()); return }
    setCenterWord(n.label.toLowerCase())
  }, [pick, pickWrongEdge, setCenterWord])

  /* ── 搜索（词/中文双向，全词典）──────────────────────────────────────────── */
  useEffect(() => {
    if (!searchQ.trim()) { setSearchHits([]); return }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dictionary/search?q=${encodeURIComponent(searchQ.trim())}&limit=8`, { signal: ctrl.signal })
        const json = await res.json()
        setSearchHits((json.data ?? []).map((w: { id: string; word: string; definitions?: { definitionZh?: string; definitionEn?: string }[] }) => ({
          id: w.id, word: w.word, zh: w.definitions?.[0]?.definitionZh ?? w.definitions?.[0]?.definitionEn ?? '',
        })))
      } catch { /* aborted */ }
    }, 220)
    return () => { ctrl.abort(); clearTimeout(timer) }
  }, [searchQ])

  /* ── 遗忘预警数据 ─────────────────────────────────────────────────────────── */
  const overdueWords = useMemo(() => {
    const now = Date.now()
    return storeWords
      .filter(w => w.nextReviewAt != null && w.nextReviewAt < now)
      .map(w => ({ ...w, days: Math.max(1, Math.floor((now - w.nextReviewAt!) / 86400000)) }))
      .sort((a, b) => b.days - a.days)
  }, [storeWords])

  const addAllToToday = useCallback(() => {
    const lexi = useLexiStore.getState()
    overdueWords.forEach(w => lexi.addToReview(w.id))
    setToast(`已将 ${overdueWords.length} 个过期词加入今日复习`)
    setTimeout(() => setToast(''), 2400)
    setAlertOpen(false)
    void buildMemoryGraph()
  }, [overdueWords, buildMemoryGraph])

  const learnable = storeWords.filter(w => w.state !== 'locked' && w.state !== 'unknown')
  const cd = centerData
  const inStore = center ? storeWords.find(w => w.id === center) : null

  /* ════════════════════════════ 渲染 ═════════════════════════════════════ */
  return (
    <div data-mode={mode} data-wrong-edges={wrongPairs.length}
      style={{ position: 'fixed', inset: 0, background: '#04070c', overflow: 'hidden', fontFamily: '"Noto Sans SC", sans-serif' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, cursor: 'grab' }}
        onMouseMove={onMouseMove}
        onClick={onClick}
        onMouseDown={e => { stateRef.current.drag = { x: e.clientX, y: e.clientY, cx: stateRef.current.cam.tx, cy: stateRef.current.cam.ty } }}
        onMouseUp={() => { stateRef.current.drag = null }}
        onMouseLeave={() => { stateRef.current.drag = null; setTip(null) }}
        onWheel={e => {
          const c = stateRef.current.cam
          c.ts = Math.max(0.5, Math.min(2.4, c.ts * (e.deltaY > 0 ? 0.92 : 1.08)))
        }}
      />

      {/* 顶栏 */}
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', zIndex: 20 }}>
        <button onClick={goBack} disabled={!history.length} title="返回上一个词（Esc）"
          style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(159,182,196,0.25)', background: 'rgba(10,22,34,0.8)', color: history.length ? '#eaf3f6' : '#4a5a66', cursor: history.length ? 'pointer' : 'default', fontSize: 16 }}>←</button>
        <div style={{ color: '#eaf3f6', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>
          Lexi<i style={{ color: '#4fe6ce', fontStyle: 'normal' }}>Graph</i>
          <small style={{ marginLeft: 8, fontSize: 10, color: 'rgba(234,243,246,0.4)', letterSpacing: '0.1em' }}>词形 · 关系 · 图谱</small>
        </div>
        {/* segmented：语义｜记忆 */}
        <div style={{ display: 'flex', borderRadius: 9, overflow: 'hidden', border: '1px solid rgba(159,182,196,0.25)' }}>
          {([['semantic', '语义图谱'], ['memory', '记忆图谱']] as const).map(([m, zh]) => (
            <button key={m} onClick={() => setMode(m)}
              style={{ padding: '7px 14px', fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: mode === m ? 'rgba(79,230,206,0.16)' : 'rgba(10,22,34,0.8)', color: mode === m ? '#4fe6ce' : 'rgba(234,243,246,0.6)' }}>{zh}</button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="搜索词或中文释义…"
            style={{ width: '100%', padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(159,182,196,0.25)', background: 'rgba(10,22,34,0.8)', color: '#eaf3f6', fontSize: 13, outline: 'none' }} />
          {!!searchHits.length && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'rgba(10,22,34,0.96)', border: '1px solid rgba(159,182,196,0.25)', borderRadius: 10, overflow: 'hidden', zIndex: 30 }}>
              {searchHits.map(h => (
                <div key={h.id} onClick={() => { setCenterWord(h.id); setSearchQ(''); setMode('semantic') }}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(159,182,196,0.08)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,230,206,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ color: '#eaf3f6', fontSize: 13 }}>{h.word}</span>
                  <span style={{ color: 'rgba(234,243,246,0.45)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.zh}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {mode === 'memory' && (
          <button onClick={() => setAlertOpen(true)}
            style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(242,135,158,0.5)', background: overdueWords.length ? 'rgba(242,135,158,0.14)' : 'rgba(10,22,34,0.8)', color: '#f2879e', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ⚠ 遗忘预警{overdueWords.length ? ` · ${overdueWords.length}` : ''}
          </button>
        )}
        <button onClick={() => router.push(`/lexiverse${center ? `?word=${encodeURIComponent(center)}` : ''}`)}
          style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(79,230,206,0.4)', background: 'rgba(79,230,206,0.1)', color: '#4fe6ce', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>在宇宙中查看 ✦</button>
      </header>

      {/* 过滤 chips（panel-open 让位：原型 body.panel-open 处理） */}
      {mode === 'semantic' && (
        <nav style={{ position: 'absolute', top: 64, left: 16, display: 'flex', gap: 8, zIndex: 15, transition: 'transform 0.25s', transform: panelOpen && typeof window !== 'undefined' && window.innerWidth < 1100 ? 'translateY(-130%)' : 'none' }}>
          {Object.entries(TYPE_META).map(([t, m]) => (
            <button key={t} onClick={() => setFilters(f => ({ ...f, [t]: !f[t] }))}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filters[t] ? m.color + '66' : 'rgba(159,182,196,0.2)'}`, background: filters[t] ? 'rgba(10,22,34,0.85)' : 'rgba(10,22,34,0.5)', color: filters[t] ? m.color : 'rgba(234,243,246,0.35)' }}>
              <i style={{ width: 8, height: 8, borderRadius: 999, background: filters[t] ? m.color : 'rgba(159,182,196,0.3)' }} />{m.zh}
            </button>
          ))}
        </nav>
      )}
      {mode === 'memory' && (
        <nav style={{ position: 'absolute', top: 64, left: 16, display: 'flex', gap: 8, zIndex: 15, alignItems: 'center' }}>
          <button onClick={() => setFilters(f => ({ ...f, syn: !f.syn }))}
            style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filters.syn ? 'rgba(159,182,196,0.4)' : 'rgba(159,182,196,0.15)'}`, background: 'rgba(10,22,34,0.7)', color: filters.syn ? 'rgba(234,243,246,0.75)' : 'rgba(234,243,246,0.3)' }}>语义边</button>
          {Object.entries({ 过期: MEM.overdue, 即将到期: MEM.soon, '强(≥16天)': MEM.strong, 学习中: MEM.active, 未开始: MEM.idle }).map(([zh, c]) => (
            <span key={zh} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(234,243,246,0.55)' }}>
              <i style={{ width: 8, height: 8, borderRadius: 999, background: c }} />{zh}
            </span>
          ))}
        </nav>
      )}

      {/* 词迹 */}
      {mode === 'semantic' && (
        <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 15, maxWidth: '60vw', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(234,243,246,0.35)' }}>词迹</span>
          {[...history, center].filter(Boolean).map((w, i, arr) => {
            const now = i === arr.length - 1
            return (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span onClick={() => { if (!now) { setHistory(h => h.slice(0, i)); setCenter(w!) } }}
                  style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: now ? 'default' : 'pointer', background: now ? 'rgba(79,230,206,0.16)' : 'rgba(10,22,34,0.7)', color: now ? '#4fe6ce' : 'rgba(234,243,246,0.6)', border: `1px solid ${now ? 'rgba(79,230,206,0.4)' : 'rgba(159,182,196,0.2)'}` }}>{w}</span>
                {!now && <span style={{ color: 'rgba(234,243,246,0.25)' }}>›</span>}
              </span>
            )
          })}
        </div>
      )}

      {/* tooltip（词/中文/音标 + 状态色点） */}
      {tip && (
        <div style={{ position: 'fixed', left: Math.min(tip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 260), top: tip.y + 14, zIndex: 40, background: 'rgba(10,22,34,0.95)', border: '1px solid rgba(159,182,196,0.3)', borderRadius: 10, padding: '10px 14px', maxWidth: 240, pointerEvents: 'none' }}>
          <b style={{ color: '#fff', fontSize: 14 }}>{tip.node.label}</b>
          {tip.node.state && <i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: STATE_COLORS[tip.node.state], marginLeft: 8 }} />}
          <div style={{ color: '#4fe6ce', fontSize: 12.5, marginTop: 3, fontFamily: '"Noto Serif SC", serif' }}>{tip.node.zh || cd?.wordsMeta[tip.node.label.toLowerCase()]?.zh || '—'}</div>
          <div style={{ color: 'rgba(234,243,246,0.4)', fontSize: 10.5, marginTop: 3, fontFamily: '"Space Mono", monospace' }}>
            {tip.node.phrase ? 'COLLOCATION' : (cd?.wordsMeta[tip.node.label.toLowerCase()]?.phon ?? '')}{tip.node.type === 'mem' ? ' · 点击进语义图谱' : tip.node.phrase ? '' : ' · 点击设为中心'}
          </div>
        </div>
      )}

      {/* 详情面板（语义模式） */}
      {mode === 'semantic' && panelOpen && center && (
        <aside style={{ position: 'absolute', top: 60, right: 14, bottom: 14, width: 320, zIndex: 25, background: 'rgba(8,18,28,0.94)', border: '1px solid rgba(159,182,196,0.22)', borderRadius: 16, padding: '18px 20px', overflowY: 'auto', backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setPanelOpen(false)} style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(159,182,196,0.25)', background: 'transparent', color: 'rgba(234,243,246,0.6)', cursor: 'pointer' }}>✕</button>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {inStore && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: STATE_COLORS[inStore.state] ?? '#9fb6c4', border: `1px solid ${(STATE_COLORS[inStore.state] ?? '#9fb6c4')}55`, background: `${STATE_COLORS[inStore.state] ?? '#9fb6c4'}14` }}><i style={{ width: 7, height: 7, borderRadius: 999, background: STATE_COLORS[inStore.state] ?? '#9fb6c4' }} />{STATE_ZH[inStore.state] ?? inStore.state}</span>}
            {cd?.lv && <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, color: 'rgba(234,243,246,0.6)', border: '1px solid rgba(159,182,196,0.25)' }}>{cd.lv}</span>}
            {cd?.pos && <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, color: 'rgba(234,243,246,0.6)', border: '1px solid rgba(159,182,196,0.25)' }}>{cd.pos}</span>}
          </div>
          <h2 style={{ margin: '4px 0 2px', fontSize: 26, fontWeight: 600, color: '#fff', fontFamily: '"Space Grotesk", sans-serif' }}>{center}</h2>
          <div style={{ fontSize: 12, color: 'rgba(234,243,246,0.45)', fontFamily: '"Space Mono", monospace' }}>{cd?.phon}</div>
          <div style={{ fontSize: 14.5, color: '#4fe6ce', margin: '6px 0 14px', fontFamily: '"Noto Serif SC", serif' }}>{cd?.zh}</div>

          {!!cd?.forms.length && (<>
            <div style={panelSec}>词形变化 · MORPHOLOGY</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}><tbody>
              {cd.forms.map(f => (
                <tr key={f.w} style={{ borderBottom: '1px solid rgba(159,182,196,0.08)' }}>
                  <td onClick={() => setCenterWord(f.w)} style={{ padding: '6px 4px', color: '#4fe6ce', cursor: 'pointer', fontSize: 13 }}>{f.w}</td>
                  <td style={{ padding: '6px 4px', color: 'rgba(234,243,246,0.4)', fontSize: 10.5, fontFamily: '"Space Mono", monospace' }}>{f.suf}</td>
                  <td style={{ padding: '6px 4px', color: 'rgba(234,243,246,0.65)', fontSize: 12 }}>{f.zh}</td>
                </tr>
              ))}
            </tbody></table>
          </>)}

          {([['近义 · SYNONYM', cd?.syn ?? [], '#4fe6a0', null], ['反义 · ANTONYM', cd?.ant ?? [], '#6da7ff', null]] as const).map(([title, list, color]) => (
            <div key={title as string}>
              <div style={panelSec}>{title}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {(list as string[]).length ? (list as string[]).map(w => (
                  <span key={w} onClick={() => setCenterWord(w)} style={{ padding: '4px 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', color: color as string, border: `1px solid ${color}66` }}>{w}</span>
                )) : <span style={{ fontSize: 11, color: 'rgba(234,243,246,0.3)' }}>—</span>}
              </div>
            </div>
          ))}

          <div style={panelSec}>易混 · CONFUSABLE</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {cd?.conf.length ? cd.conf.map(c => (
              <span key={c.w} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span onClick={() => setCenterWord(c.w)} title={c.hint} style={{ padding: '4px 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', color: '#f2879e', border: '1px solid rgba(242,135,158,0.4)' }}>{c.w}</span>
                <button onClick={() => router.push(`/quiz?word=${encodeURIComponent(center)}&vs=${encodeURIComponent(c.w)}`)}
                  style={{ padding: '4px 9px', borderRadius: 999, fontSize: 10.5, cursor: 'pointer', color: '#ffd58f', border: '1px solid rgba(232,176,75,0.45)', background: 'rgba(232,176,75,0.08)' }}>出辨析题</button>
              </span>
            )) : <span style={{ fontSize: 11, color: 'rgba(234,243,246,0.3)' }}>—</span>}
          </div>

          <div style={panelSec}>常用搭配 · COLLOCATION</div>
          <div style={{ marginBottom: 16 }}>
            {cd?.collo.length ? cd.collo.map(c => (
              <div key={c.phrase} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(159,182,196,0.08)', fontSize: 12.5 }}>
                <span style={{ color: '#ffd58f' }}>{c.phrase}</span>
                <span style={{ color: 'rgba(234,243,246,0.55)' }}>{c.zh}</span>
              </div>
            )) : <div style={{ fontSize: 11, color: 'rgba(234,243,246,0.3)' }}>—</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!inStore ? (
              <button onClick={async () => {
                const res = await fetch(`/api/dictionary/word/${encodeURIComponent(center)}`)
                const json = res.ok ? await res.json() : null
                if (json?.data) {
                  const lexi = useLexiStore.getState()
                  lexi.ensureWord(json.data, 'lookup')
                  lexi.recordActivity('learned')
                  setToast('已加入学习'); setTimeout(() => setToast(''), 2000)
                }
              }} style={actionPrimary}>+ 加入学习</button>
            ) : (
              <span style={{ ...actionPrimary, opacity: 0.65, cursor: 'default' }}>✓ {STATE_ZH[inStore.state] ?? '已在学习'}</span>
            )}
            <button onClick={() => router.push(`/quiz?word=${encodeURIComponent(center)}`)} style={actionGhost}>考一考</button>
            <button onClick={() => router.push(`/word/${encodeURIComponent(center)}`)} style={actionGhost}>词详情页 →</button>
          </div>
        </aside>
      )}

      {/* 记忆图谱：空状态（<10 词） */}
      {mode === 'memory' && learnable.length < 10 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 18, pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', background: 'rgba(8,18,28,0.9)', border: '1px solid rgba(159,182,196,0.22)', borderRadius: 16, padding: '28px 36px', pointerEvents: 'auto' }}>
            <div style={{ fontSize: 15, color: '#eaf3f6', marginBottom: 6 }}>记忆图谱会随着你的学习生长</div>
            <div style={{ fontSize: 12.5, color: 'rgba(234,243,246,0.5)', marginBottom: 16 }}>先去学今天的词包（当前 {learnable.length}/10 词）</div>
            <button onClick={() => router.push('/learn')} style={actionPrimary}>去学习 →</button>
          </div>
        </div>
      )}

      {/* 对比卡（点共错红边） */}
      {compare && <CompareCard a={compare.a} b={compare.b} count={compare.count} onClose={() => setCompare(null)}
        onQuiz={() => router.push(`/quiz?word=${encodeURIComponent(compare.a)}&vs=${encodeURIComponent(compare.b)}`)} />}

      {/* 遗忘预警面板 */}
      {alertOpen && (
        <aside style={{ position: 'absolute', top: 60, right: 14, width: 300, maxHeight: '70vh', zIndex: 26, background: 'rgba(8,18,28,0.96)', border: '1px solid rgba(242,135,158,0.4)', borderRadius: 16, padding: '18px 20px', overflowY: 'auto' }}>
          <button onClick={() => setAlertOpen(false)} style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(159,182,196,0.25)', background: 'transparent', color: 'rgba(234,243,246,0.6)', cursor: 'pointer' }}>✕</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f2879e', marginBottom: 4 }}>⚠ 遗忘预警 · {overdueWords.length} 词过期</div>
          <div style={{ fontSize: 11.5, color: 'rgba(234,243,246,0.5)', marginBottom: 12 }}>这些词已过复习期，记忆正在衰退</div>
          {overdueWords.length > 0 && (
            <button onClick={addAllToToday} style={{ ...actionPrimary, width: '100%', marginBottom: 12 }}>全部加入今日复习</button>
          )}
          {overdueWords.slice(0, 30).map(w => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(159,182,196,0.08)', fontSize: 12.5 }}>
              <span onClick={() => { setMode('semantic'); setCenterWord(w.id) }} style={{ color: '#eaf3f6', cursor: 'pointer' }}>{w.word}</span>
              <span style={{ color: '#f2879e' }}>过期 {w.days} 天</span>
            </div>
          ))}
          {!overdueWords.length && <div style={{ fontSize: 12, color: 'rgba(234,243,246,0.45)' }}>没有过期词 — 记忆状态良好 ✓</div>}
        </aside>
      )}

      {/* 首访引导（dismissible 单句） */}
      {intro && (
        <div style={{ position: 'absolute', bottom: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(8,18,28,0.94)', border: '1px solid rgba(79,230,206,0.35)', borderRadius: 12, padding: '10px 18px' }}>
          <span style={{ fontSize: 12.5, color: '#eaf3f6' }}>点击任意节点设为中心 · 悬停看中文 · 顶部可切换记忆图谱</span>
          <button onClick={() => { setIntro(false); localStorage.setItem(FIRST_VISIT_KEY, '1') }}
            style={{ border: 'none', background: 'transparent', color: '#4fe6ce', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>知道了</button>
        </div>
      )}

      {toast && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'rgba(8,18,28,0.95)', border: '1px solid rgba(79,230,206,0.4)', color: '#4fe6ce', borderRadius: 10, padding: '9px 18px', fontSize: 13 }}>{toast}</div>
      )}
    </div>
  )
}

/* ── 对比卡：双词并排 + 出辨析题 ──────────────────────────────────────────── */
function CompareCard({ a, b, count, onClose, onQuiz }: { a: string; b: string; count: number; onClose: () => void; onQuiz: () => void }) {
  const [data, setData] = useState<Record<string, { zh: string; phon: string; pos: string; example: string } | null>>({})
  useEffect(() => {
    let cancelled = false
    Promise.all([a, b].map(async w => {
      const res = await fetch(`/api/dictionary/word/${encodeURIComponent(w)}`)
      const json = res.ok ? await res.json() : null
      const d = json?.data
      return [w, d ? {
        zh: d.definitions?.[0]?.definitionZh ?? d.definitions?.[0]?.definitionEn ?? '',
        phon: d.phoneticIpa ?? '', pos: d.definitions?.[0]?.partOfSpeech ?? '',
        example: d.examples?.[0]?.sentenceEn ?? '',
      } : null] as const
    })).then(entries => { if (!cancelled) setData(Object.fromEntries(entries)) })
    return () => { cancelled = true }
  }, [a, b])
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,12,0.6)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(620px, 92vw)', background: 'rgba(8,18,28,0.97)', border: '1px solid rgba(242,135,158,0.4)', borderRadius: 18, padding: '22px 26px' }}>
        <div style={{ fontSize: 12, color: '#f2879e', marginBottom: 14, fontWeight: 700 }}>⚡ 共同出错 {count} 次 — 这两个词在混淆你</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[a, b].map(w => (
            <div key={w} style={{ border: '1px solid rgba(159,182,196,0.18)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', fontFamily: '"Space Grotesk", sans-serif' }}>{w}</div>
              <div style={{ fontSize: 11, color: 'rgba(234,243,246,0.4)', fontFamily: '"Space Mono", monospace', margin: '2px 0 6px' }}>{data[w]?.phon} {data[w]?.pos && `· ${data[w]?.pos}`}</div>
              <div style={{ fontSize: 13.5, color: '#4fe6ce', fontFamily: '"Noto Serif SC", serif' }}>{data[w]?.zh ?? '…'}</div>
              {data[w]?.example && <div style={{ fontSize: 11.5, color: 'rgba(234,243,246,0.55)', fontStyle: 'italic', marginTop: 8 }}>“{data[w]!.example}”</div>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={actionGhost}>关闭</button>
          <button onClick={onQuiz} style={actionPrimary}>出一道辨析题 →</button>
        </div>
      </div>
    </div>
  )
}

const panelSec: React.CSSProperties = { fontSize: 10, letterSpacing: '0.15em', color: 'rgba(234,243,246,0.4)', margin: '10px 0 7px', fontFamily: '"Space Mono", monospace' }
const actionPrimary: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(79,230,206,0.5)', background: 'rgba(79,230,206,0.14)', color: '#4fe6ce', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const actionGhost: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(159,182,196,0.3)', background: 'transparent', color: 'rgba(234,243,246,0.7)', fontSize: 13, cursor: 'pointer' }
