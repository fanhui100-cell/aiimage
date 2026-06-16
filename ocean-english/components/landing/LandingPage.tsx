'use client'

/* ════════════════════════════════════════════════════════════════════════
   界面优化3 · 落地页（未登录 /）—— 1:1 自「主页C-沉浸星海.html」重建
   · 顶栏接项目真实路由：PRIMARY_NAV / TOOL_NAV / ⌘K(命令面板) / /search / 主题 / /auth/login
   · 主题走项目 toggleThemeMode()；落地页深色为默认，夜间令牌生效时切米白（见 landing.css）
   · 动效（升尘 canvas / 可交互星系 canvas / 指针光斑 / 浮现 / 逐字 / 磁吸）移植自 lexi-motion.js + 源文件内联脚本
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLexiStore } from '@/store/lexiStore'
import { useCommandPalette } from '@/components/ui/motion/CommandPalette'
import { toggleThemeMode, getThemeMode } from '@/lib/theme-mode'
import { PRIMARY_NAV, TOOL_NAV } from '@/lib/product-flow/nav'

export function LandingPage() {
  const cmd = useCommandPalette()
  const dueCount = useLexiStore(s => s.getDue().length + s.wrongAnswers.length)
  const rootRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const dustRef = useRef<HTMLCanvasElement>(null)
  const galaxyRef = useRef<HTMLCanvasElement>(null)
  const wordInputRef = useRef<HTMLInputElement>(null)
  const galaxyAddRef = useRef<((label: string, seed?: boolean) => void) | null>(null)
  const [tools, setTools] = useState(false)
  const [night, setNight] = useState(false)

  useEffect(() => { setNight(getThemeMode() === 'dark') }, [])
  const onTheme = () => setNight(toggleThemeMode() === 'dark')

  /* ── 浮现 + 逐字（IntersectionObserver + setTimeout 兜底，照搬源文件隐藏帧逻辑）── */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal,[data-words]'))
    const splitWords = (el: HTMLElement) => {
      if (el.dataset.split) return
      el.dataset.split = '1'
      const txt = el.textContent ?? ''
      el.textContent = ''
      el.classList.add('word-rise')
      Array.from(txt).forEach((ch, i) => {
        const s = document.createElement('span')
        s.textContent = ch === ' ' ? ' ' : ch
        s.style.animationDelay = `${i * 0.045}s`
        el.appendChild(s)
      })
      setTimeout(() => el.querySelectorAll('span').forEach(s => { (s as HTMLElement).style.opacity = '1'; (s as HTMLElement).style.transform = 'none' }), txt.length * 45 + 750)
    }
    const trigger = (el: HTMLElement) => {
      if (el.dataset.revealed) return
      el.dataset.revealed = '1'
      if (el.classList.contains('reveal')) el.classList.add('in')
      if (el.hasAttribute('data-words')) splitWords(el)
    }
    const io = new IntersectionObserver(ents => ents.forEach(e => { if (e.isIntersecting) { trigger(e.target as HTMLElement); io.unobserve(e.target) } }), { threshold: 0.18, rootMargin: '0px 0px -8% 0px' })
    els.forEach(el => io.observe(el))
    const sweep = () => {
      const vh = window.innerHeight || 800
      els.forEach(el => { if (el.dataset.revealed) return; const r = el.getBoundingClientRect(); if (r.top < vh * 0.95 && r.bottom > 0) { trigger(el); io.unobserve(el) } })
    }
    const t1 = setTimeout(sweep, 120), t2 = setTimeout(sweep, 600)
    window.addEventListener('load', sweep)
    window.addEventListener('scroll', sweep, { passive: true })
    return () => { io.disconnect(); clearTimeout(t1); clearTimeout(t2); window.removeEventListener('load', sweep); window.removeEventListener('scroll', sweep) }
  }, [])

  /* ── 磁吸按钮 + 指针光斑 ── */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !window.matchMedia('(pointer:fine)').matches) return
    const cleanups: (() => void)[] = []
    root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(el => {
      const pull = parseFloat(el.getAttribute('data-magnetic') || '0.3') || 0.3
      const move = (e: MouseEvent) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * pull}px,${(e.clientY - r.top - r.height / 2) * pull}px)` }
      const leave = () => { el.style.transform = '' }
      el.addEventListener('mousemove', move); el.addEventListener('mouseleave', leave)
      cleanups.push(() => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) })
    })
    const spot = root.querySelector<HTMLElement>('.bg-spot')
    const onMove = (e: MouseEvent) => { if (spot) { spot.style.setProperty('--mx', `${e.clientX}px`); spot.style.setProperty('--my', `${e.clientY}px`) } }
    window.addEventListener('mousemove', onMove)
    cleanups.push(() => window.removeEventListener('mousemove', onMove))
    return () => cleanups.forEach(fn => fn())
  }, [])

  /* ── 顶栏滚动加毛玻璃 ── */
  useEffect(() => {
    const onScroll = () => { if (navRef.current) navRef.current.style.backdropFilter = window.scrollY > 40 ? 'blur(18px) saturate(150%)' : 'none' }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── 升尘 canvas ── */
  useEffect(() => {
    const c = dustRef.current; if (!c) return
    const x = c.getContext('2d'); if (!x) return
    let st: { x: number; y: number; r: number; vy: number; p: number; s: number }[] = []
    let raf = 0, t = 0
    const rs = () => { c.width = innerWidth; c.height = innerHeight; st = []; const n = Math.min(240, innerWidth / 6 | 0); for (let i = 0; i < n; i++) st.push({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.4 + .3, vy: -(Math.random() * .25 + .05), p: Math.random() * 6.28, s: Math.random() * 1.4 + .5 }) }
    rs(); addEventListener('resize', rs)
    const loop = () => {
      t += .016; x.clearRect(0, 0, c.width, c.height)
      const day = document.documentElement.getAttribute('data-theme') === 'night'
      for (const s of st) { s.y += s.vy; if (s.y < -4) { s.y = c.height + 4; s.x = Math.random() * c.width } const a = .2 + .5 * Math.abs(Math.sin(t * s.s + s.p)); x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.28); x.fillStyle = (day ? 'rgba(14,140,122,' : 'rgba(150,225,235,') + a + ')'; x.fill() }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', rs) }
  }, [])

  /* ── 可交互词语星系 canvas ── */
  useEffect(() => {
    const canvas = galaxyRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2)
    let W = 0, H = 0, raf = 0
    type Node = { label: string; x: number; y: number; vx: number; vy: number; r: number; born: number; big: boolean }
    const nodes: Node[] = [], links: { a: Node; b: Node; born: number }[] = []
    const resize = () => { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize(); addEventListener('resize', resize)
    const sprite = (r: number, g: number, b: number) => { const s = document.createElement('canvas'); s.width = s.height = 32; const c = s.getContext('2d')!; const h = 16, gr = c.createRadialGradient(h, h, 0, h, h, h); gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.4, `rgba(${r},${g},${b},.5)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); return s }
    const glow = sprite(127, 240, 230), glowGold = sprite(241, 200, 121)
    const add = (label: string, seed?: boolean) => {
      const cx = W / 2, cy = H / 2, ang = Math.random() * 6.28, rad = seed ? 40 + Math.random() * 60 : 8
      const n: Node = { label, x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, vx: (Math.random() - .5) * (seed ? .2 : 1.4), vy: (Math.random() - .5) * (seed ? .2 : 1.4), r: seed ? 3.4 : 4.2, born: performance.now(), big: !seed }
      nodes.push(n)
      const ds = nodes.slice(0, -1).map(m => ({ m, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 })).sort((a, b) => a.d - b.d)
      for (let i = 0; i < Math.min(2, ds.length); i++) links.push({ a: n, b: ds[i].m, born: performance.now() })
      if (nodes.length > 26) { const dead = nodes.shift()!; for (let i = links.length - 1; i >= 0; i--) if (links[i].a === dead || links[i].b === dead) links.splice(i, 1) }
    }
    galaxyAddRef.current = add
    ;['lexiverse', 'word', 'galaxy', 'light', 'deep', 'learn', 'memory', 'root'].forEach((w, i) => setTimeout(() => add(w, true), i * 120))
    const step = () => {
      const cx = W / 2, cy = H / 2
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < nodes.length; i++) { const n = nodes[i]; n.vx += (cx - n.x) * 0.0006; n.vy += (cy - n.y) * 0.0006; for (let j = i + 1; j < nodes.length; j++) { const m = nodes[j]; const dx = n.x - m.x, dy = n.y - m.y, d2 = dx * dx + dy * dy + 0.01; if (d2 < 9000) { const f = 120 / d2; n.vx += dx * f * 0.02; n.vy += dy * f * 0.02; m.vx -= dx * f * 0.02; m.vy -= dy * f * 0.02 } } n.vx *= 0.94; n.vy *= 0.94; n.x += n.vx; n.y += n.vy; n.x = Math.max(30, Math.min(W - 30, n.x)); n.y = Math.max(36, Math.min(H - 46, n.y)) }
      ctx.lineWidth = 1
      for (const l of links) { const a = Math.min(1, (performance.now() - l.born) / 600); ctx.strokeStyle = `rgba(79,230,206,${0.16 * a})`; ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.lineTo(l.b.x, l.b.y); ctx.stroke() }
      ctx.globalCompositeOperation = 'lighter'
      for (const n of nodes) { const g = n.big ? glowGold : glow; const d = n.r * (n.big ? 7 : 5.5); ctx.globalAlpha = .9; ctx.drawImage(g, n.x - d / 2, n.y - d / 2, d, d) }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
      ctx.textAlign = 'center'; ctx.font = '600 12px "Space Grotesk", sans-serif'
      for (const n of nodes) { const ap = Math.min(1, (performance.now() - n.born) / 500); ctx.fillStyle = n.big ? `rgba(241,200,121,${0.95 * ap})` : `rgba(234,243,246,${0.8 * ap})`; ctx.fillText(n.label, n.x, n.y - 9) }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); galaxyAddRef.current = null }
  }, [])

  const submitWord = () => { const v = wordInputRef.current?.value.trim(); if (!v) return; galaxyAddRef.current?.(v.slice(0, 18), false); if (wordInputRef.current) wordInputRef.current.value = '' }

  const ic = (path: React.ReactNode) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>

  return (
    <div className="lxland" ref={rootRef}>
      <canvas id="dust" ref={dustRef} />
      <div className="bg-aura"><b className="a1" /><b className="a2" /><b className="a3" /></div>
      <div className="bg-beam" />
      <div className="bg-grid" />
      <div className="bg-spot" />
      <div className="bg-grain" />

      {/* 顶栏 —— 接项目真实路由 */}
      <nav className="nav" ref={navRef}>
        <Link className="brand" href="/">
          <span className="mark"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 6.5 12 19 20.5 6.5" /><path d="M7.5 6 12 13 16.5 6" opacity="0.55" /></svg></span>
          <span className="wm"><span className="z">Lexi<em>verse</em></span><span className="e">词渊</span></span>
        </Link>
        <div className="links">
          {PRIMARY_NAV.map(item => (
            <Link key={item.key} href={item.href}>{item.zh}{item.key === 'drill' && dueCount > 0 && <span className="dot" />}</Link>
          ))}
          <div id="toolsdd" onMouseLeave={() => setTools(false)}>
            <a id="toolsbtn" onClick={() => setTools(o => !o)}>工具<svg id="toolschev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transition: 'transform .15s', transform: tools ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg></a>
            {tools && (
              <div id="toolsmenu">
                {TOOL_NAV.map(t => <Link key={t.key} href={t.href} onClick={() => setTools(false)}>{t.zh}<span>{t.en}</span></Link>)}
              </div>
            )}
          </div>
        </div>
        <div className="right">
          <button className="pill" onClick={cmd.open}>{ic(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>)}<span>全部</span><kbd>⌘K</kbd></button>
          <Link className="icon-btn" href="/search" aria-label="搜索"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></Link>
          <button className="theme-btn" onClick={onTheme} aria-label="切换日光/夜间">
            {night
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>}
          </button>
          <Link className="btn btn-primary" href="/auth/login" data-magnetic="0.2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>登录</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero wrap lqg">
        <span className="badge reveal in"><span className="ping"><b /></span>深空英语学习系统</span>
        <h1 data-words>万词成海，自有光</h1>
        <p className="en reveal">An ocean of words, lit from within.</p>
        <p className="lead reveal reveal-d1">一个词从不孤单。记住它，就点亮它的近义、词根与语境——连成一片会发光、可漫游的星海。</p>
        <div className="cta reveal reveal-d2 lqg">
          <Link className="lq lq-btn accent" href="/auth/login" data-magnetic="0.25"><span className="lq-sheen" /><span>开始学习 →</span></Link>
          <a className="lq lq-btn" href="#demo"><span className="lq-sheen" /><span>先试一个词</span></a>
        </div>
        <div className="scrollhint"><span className="m" />SCROLL</div>
      </header>

      {/* Chapters */}
      <section className="chapter wrap" id="chapter1">
        <div className="ck reveal">01 · 孤词难记</div>
        <h2 className="reveal reveal-d1">背下来，<br />又忘掉，<em>循环往复</em>。</h2>
        <p className="reveal reveal-d2">死记硬背把单词当成一串孤立的字母。没有语境、没有联系，记忆很快就退潮——这是绝大多数单词软件的通病。</p>
      </section>
      <section className="chapter wrap right" id="chapter2">
        <div className="ck reveal">02 · 万物互联</div>
        <h2 className="reveal reveal-d1">每个词，<br />都有<em>自己的引力</em>。</h2>
        <p className="reveal reveal-d2">近义、反义、词根、同源、真实语境——词渊把这些关系织成一张网。你不是在记一个词，而是在点亮一整片星系。</p>
      </section>
      <section className="chapter wrap" id="chapter3">
        <div className="ck reveal">03 · 自有光</div>
        <h2 className="reveal reveal-d1">掌握的词，<br />会<em>自己发光</em>。</h2>
        <p className="reveal reveal-d2">学、练、复习、追问，一处闭环。随着掌握度提升，你的词汇宇宙越来越亮——进步，第一次变得看得见。</p>
      </section>

      {/* Interactive demo */}
      <section className="demo wrap lqg" id="demo">
        <div className="head reveal">
          <div className="k">Try it · 此刻就试</div>
          <h2>输入一个单词，看它进入星系</h2>
          <p>敲一个你最近在背的词，按回车——它会落进星图，连上邻近的词。这正是词渊在做的事。</p>
        </div>
        <div className="stage reveal reveal-d1">
          <canvas id="galaxy" ref={galaxyRef} />
          <div className="hintchips">
            {['serendipity', 'resilience', 'luminous', 'abyss', 'nuance'].map(w => <span key={w} onClick={() => galaxyAddRef.current?.(w, false)}>{w}</span>)}
          </div>
          <div className="bar">
            <div className="lq lq-field"><span className="lq-sheen" />
              <svg className="lead" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input ref={wordInputRef} placeholder="输入一个英文单词，回车…" autoComplete="off" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitWord() } }} />
              <button className="lq-iconbtn" type="button" aria-label="加入星系" onClick={submitWord}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="show wrap" id="show">
        <div className="head reveal">
          <div className="k">Inside the app</div>
          <h2>每天打开，<br />它都为你编排好了</h2>
        </div>
        <div className="stagewrap reveal reveal-d1">
          <div className="screen">
            <div className="topbar"><i /><i /><i /><span className="url">lexiverse.app/today</span></div>
            <div className="body">
              <div className="panel">
                <div className="k">今日学习 · Today</div>
                <h4>还有 7 个词待完成</h4>
                <div className="sub">今日包剩余 3 推荐 · 2 待复习 · 2 薄弱</div>
                <div className="ringrow"><span className="pct">42%</span><div style={{ flex: 1 }}><div className="barfill"><i /></div></div></div>
                <div className="chipline"><span>▶ 继续学习</span><span>◴ 词汇宇宙</span><span>✦ 领航答疑</span><span>↻ 间隔复习</span></div>
              </div>
              <div className="panel">
                <div className="k">掌握度 · Mastery</div>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 30, color: '#4fe6ce' }}>12%</h4>
                <div className="seg"><i style={{ flex: 34, background: '#c99a3e' }} /><i style={{ flex: 22, background: '#3b5bd9' }} /><i style={{ flex: 14, background: '#b3781f' }} /><i style={{ flex: 8, background: '#bf4a30' }} /><i style={{ flex: 22, background: '#0e8c7a' }} /></div>
                <div className="sub" style={{ marginTop: 10 }}>已掌握 386 · 学习中 68 · 薄弱 12</div>
              </div>
            </div>
          </div>
          <div className="callout c1"><span className="dt" />AI 领航 · 随时答疑</div>
          <div className="callout c2"><span className="dt" />间隔复习 · 自动提醒</div>
          <div className="callout c3"><span className="dt" />词汇宇宙 · 掌握度可视</div>
        </div>
      </section>

      {/* Compare */}
      <section className="compare wrap" id="compare">
        <div className="head reveal">
          <div className="k">Why it&apos;s different</div>
          <h2>同样背词，路不一样</h2>
        </div>
        <div className="cols">
          <div className="ccol old reveal">
            <div className="t">传统背词 <em>The old way</em></div>
            <ul>
              <li><span className="ic">✕</span>一串孤立字母，背完即忘</li>
              <li><span className="ic">✕</span>脱离语境，换个句子又不认识</li>
              <li><span className="ic">✕</span>复习全靠自觉，到点没人提醒</li>
              <li><span className="ic">✕</span>进度看不见，越背越没动力</li>
            </ul>
          </div>
          <div className="ccol new reveal reveal-d1">
            <div className="t">词渊 <em>Lexiverse</em></div>
            <ul>
              <li><span className="ic">✓</span>每个词连上近义、词根与同源</li>
              <li><span className="ic">✓</span>在真实语境与例句中记牢</li>
              <li><span className="ic">✓</span>按遗忘曲线，到点把词送回眼前</li>
              <li><span className="ic">✓</span>掌握度化作星图，进步看得见</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="closing wrap">
        <div className="horizon" /><div className="ring1" /><div className="ring2" />
        <div className="inner lqg">
          <h2 className="reveal">今晚，<br />点亮你的第一片星系</h2>
          <p className="reveal reveal-d1">An ocean of words, lit from within.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 34, flexWrap: 'wrap' }} className="reveal reveal-d2">
            <Link className="lq lq-btn accent" href="/auth/login" data-magnetic="0.25"><span className="lq-sheen" /><span>开始学习 →</span></Link>
          </div>
        </div>
      </section>

      <footer className="foot wrap">
        <div className="row">
          <span className="z">Lexi<em>verse</em></span>
          <span>© 2026 词渊 · 万词成海，自有光</span>
        </div>
      </footer>
    </div>
  )
}
