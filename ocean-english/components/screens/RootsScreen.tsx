'use client'
/* ════════════════════════════════════════════════════════════════════════
   D9 词根/词族串记 /roots（界面优化18 移植）
   列表（按档 chips + 词族卡）→ 详情（词族成员，可整组/逐词加入学习）。
   数据：/api/roots（词族=base word→derivatives，无 morpheme 含义字段，故略「含义」）。
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { AnimatedBeam } from '@/components/ui/motion/AnimatedBeam'
import './screen-kit.css'
import './roots.css'

const LV: Record<number, string> = { 1: '初中', 2: '高中', 3: '四级', 4: '六级', 5: '考研', 6: '托福', 7: 'SAT' }
interface Family { root: string; word: string; level: number | null; count: number; members: string[] }
interface Member { slug: string; word: string; zh: string; phon: string; level: number | null }

const Ico = ({ d }: { d: React.ReactNode }) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const ROOT_IC = <><circle cx="12" cy="5" r="2.5" /><path d="M12 7.5V13M12 13l-6 6M12 13l6 6M12 13v6" /><circle cx="6" cy="19" r="2" /><circle cx="12" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>
const ALERT = <><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></>

// 高亮成员里与词根共享的词干
function Hl({ word, root }: { word: string; root: string }) {
  const i = word.toLowerCase().indexOf(root.toLowerCase())
  if (i < 0 || !root) return <>{word}</>
  return <>{word.slice(0, i)}<em>{word.slice(i, i + root.length)}</em>{word.slice(i + root.length)}</>
}

export function RootsScreen() {
  const searchParams = useSearchParams()
  const wordParam = searchParams.get('word')
  const rootParam = searchParams.get('root')
  const [ui, setUi] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [fams, setFams] = useState<Family[]>([])
  const [level, setLevel] = useState<'all' | number>('all')
  const [nonce, setNonce] = useState(0)
  // 详情
  const [openRoot, setOpenRoot] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[] | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  // 界面优化2·P5：词根→派生词流光连线用的 refs（容器 / 词根 / 前 6 个成员）
  // 用固定命名 ref（不在 render 读 .current），满足 react-hooks/refs 规则
  const beamHostRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const m0 = useRef<HTMLButtonElement>(null)
  const m1 = useRef<HTMLButtonElement>(null)
  const m2 = useRef<HTMLButtonElement>(null)
  const m3 = useRef<HTMLButtonElement>(null)
  const m4 = useRef<HTMLButtonElement>(null)
  const m5 = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false
    setUi('loading')
    fetch('/api/roots')
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (cancelled) return
        if (!j?.ok) { setUi('error'); return }
        const data = (j.data ?? []) as Family[]
        setFams(data); setUi(data.length ? 'ready' : 'empty')
      })
      .catch(() => { if (!cancelled) setUi('error') })
    return () => { cancelled = true }
  }, [nonce])

  // 从某词进入（?word= / ?root=）：直接打开它所属的词族，而非列出全部
  useEffect(() => {
    const q = wordParam ? `word=${encodeURIComponent(wordParam)}` : rootParam ? `root=${encodeURIComponent(rootParam)}` : ''
    if (!q) return
    let cancelled = false
    setMembers(null)
    fetch(`/api/roots?${q}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (cancelled) return; if (j?.data?.root) { setOpenRoot(String(j.data.root)); setMembers((j.data.members ?? []) as Member[]) } })
      .catch(() => { })
    return () => { cancelled = true }
  }, [wordParam, rootParam])

  const levelChips = useMemo(() => {
    const present = [...new Set(fams.map(f => f.level).filter((n): n is number => n != null))].sort((a, b) => a - b)
    return present
  }, [fams])
  const items = useMemo(() => level === 'all' ? fams : fams.filter(f => f.level === level), [fams, level])

  function openFamily(rootId: string) {
    setOpenRoot(rootId); setMembers(null); setAdded(new Set())
    window.scrollTo({ top: 0 })
    fetch(`/api/roots?root=${encodeURIComponent(rootId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => setMembers((j?.data?.members ?? []) as Member[]))
      .catch(() => setMembers([]))
  }
  const addMember = (m: Member) => {
    useLexiStore.getState().addWord({ id: m.slug, word: m.word, zh: m.zh, phon: m.phon })
    setAdded(prev => new Set(prev).add(m.slug))
  }

  // ── 详情视图 ──
  if (openRoot) {
    const fam = fams.find(f => f.root === openRoot)
    // 取前若干成员画「词根→派生词」连线（铺在内容之下，过多会乱，故限量到 6）
    const beamCount = members ? Math.min(members.length, 6) : 0
    return (
      <div className="scr theme-light">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <button className="rt-back" onClick={() => setOpenRoot(null)}>‹ 返回词族列表</button>
          <div ref={beamHostRef} style={{ position: 'relative' }}>
            {/* 界面优化2·P5：词根→派生词流光连线（米白 teal-ink），置于内容之下；切词族时 key 含 openRoot 以重算。
                显式逐条渲染（不对 ref 数组做 slice/map），满足 react-hooks/refs 规则 */}
            {beamCount > 0 && <AnimatedBeam key={`${openRoot}-0`} containerRef={beamHostRef} fromRef={rootRef} toRef={m0} curvature={26} delay={0} />}
            {beamCount > 1 && <AnimatedBeam key={`${openRoot}-1`} containerRef={beamHostRef} fromRef={rootRef} toRef={m1} curvature={26} delay={0.16} />}
            {beamCount > 2 && <AnimatedBeam key={`${openRoot}-2`} containerRef={beamHostRef} fromRef={rootRef} toRef={m2} curvature={26} delay={0.32} />}
            {beamCount > 3 && <AnimatedBeam key={`${openRoot}-3`} containerRef={beamHostRef} fromRef={rootRef} toRef={m3} curvature={26} delay={0.48} />}
            {beamCount > 4 && <AnimatedBeam key={`${openRoot}-4`} containerRef={beamHostRef} fromRef={rootRef} toRef={m4} curvature={26} delay={0.64} />}
            {beamCount > 5 && <AnimatedBeam key={`${openRoot}-5`} containerRef={beamHostRef} fromRef={rootRef} toRef={m5} curvature={26} delay={0.80} />}
            <div className="rt-hero" ref={rootRef}>
              <span className="rt-hero-root">{fam?.word ?? openRoot}</span>
              <div className="rt-hero-main">
                <div className="rt-hero-mean">{fam?.word ?? openRoot} 词族</div>
                <div className="rt-hero-sub">{fam?.level ? LV[fam.level] + ' · ' : ''}{(members?.length ?? fam?.count ?? 0)} 个同族词</div>
              </div>
            </div>
            <div className="rt-detail-acts">
              <button className="btn btn-primary" onClick={() => { members?.forEach(addMember) }}>整组加入学习（{members?.length ?? 0}）</button>
              <button className="btn btn-ghost" onClick={() => setOpenRoot(null)}>返回</button>
            </div>
            {members === null ? (
              <div className="rt-members">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skel" style={{ height: 50, borderRadius: 13 }} />)}</div>
            ) : (
              <div className="rt-members">
                {members.map((m, i) => {
                  const on = added.has(m.slug)
                  return (
                    <button key={m.slug} ref={i === 0 ? m0 : i === 1 ? m1 : i === 2 ? m2 : i === 3 ? m3 : i === 4 ? m4 : i === 5 ? m5 : undefined} className="rt-mem" onClick={() => addMember(m)}>
                      <span className="rt-mem-w"><Hl word={m.word} root={fam?.word ?? openRoot} /></span>
                      <span className="rt-mem-ipa">{m.phon}</span>
                      <span className="rt-mem-zh">{m.zh}</span>
                      <span className={`rt-mem-add ${on ? 'on' : ''}`}>{on ? '✓' : '+'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── 列表视图 ──
  return (
    <div className="scr theme-light">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <p className="eyebrow">词根串记 · Roots</p>
        <h1 className="h1">一个词根，串起一族词</h1>
        <p className="sub">记住词根/词干，一串派生词就能顺藤摸瓜地记下来。</p>

        {ui !== 'error' && (
          <div className="rt-chips">
            <button className={`rt-chip ${level === 'all' ? 'on' : ''}`} onClick={() => setLevel('all')}>全部</button>
            {levelChips.map(n => <button key={n} className={`rt-chip ${level === n ? 'on' : ''}`} onClick={() => setLevel(n)}>{LV[n]}</button>)}
          </div>
        )}

        {ui === 'loading' && <div className="rt-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel" style={{ height: 104, borderRadius: 16 }} />)}</div>}
        {ui === 'error' && (
          <div className="state error" style={{ marginTop: 24 }}>
            <div className="state-icon"><Ico d={ALERT} /></div>
            <div className="state-title">词族加载失败</div>
            <div className="state-desc">网络开小差，稍后重试。</div>
            <div className="state-acts"><button className="btn btn-ink" onClick={() => setNonce(n => n + 1)}>重新加载</button></div>
          </div>
        )}
        {ui === 'ready' && (
          items.length ? (
            <div className="rt-grid">
              {items.map(f => (
                <button key={f.root} className="rt-card" onClick={() => openFamily(f.root)}>
                  <div className="rt-card-top">
                    <span className="rt-root">{f.word}</span>
                    {f.level && <span className="rt-meaning">{LV[f.level]}</span>}
                    <span className="rt-count">{f.count} 词</span>
                  </div>
                  <div className="rt-preview">
                    {f.members.slice(0, 4).map(w => <span key={w} className="rt-pw">{w}</span>)}
                    {f.members.length > 4 && <span className="rt-pw more">+{f.members.length - 4}</span>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="state empty" style={{ marginTop: 24 }}>
              <div className="state-icon"><Ico d={ROOT_IC} /></div>
              <div className="state-title">该档暂无词族</div>
              <div className="state-desc">换一个难度档看看，或回到「全部」。</div>
              <div className="state-acts"><button className="btn btn-ink" onClick={() => setLevel('all')}>查看全部</button></div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
