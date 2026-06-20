/* face-wu-mock.jsx — 单词宇宙练习（self 改造）+ 模拟试卷（MockExamPicker 沿用） */
const { useState: useSW, useEffect: useEW } = React

/* ════════ 单词宇宙练习 ════════ */
const WU_RECIPES = [
  { name: '四级核心', sub: 'CET-4 · 识记', level: 'cet4', types: ['en_to_zh', 'synonym_choice', 'cloze_choice'] },
  { name: '听辨专项', sub: 'CET-4 · 听辨', level: 'cet4', types: ['listen_to_meaning', 'dictation_spell'] },
  { name: '拼写打卡', sub: '高考 · 拼写', level: 'gaokao', types: ['zh_to_word_spell', 'word_form'] },
  { name: '辨析冲刺', sub: '中考 · 易混', level: 'zhongkao', types: ['confusable_choice', 'synonym_choice'] },
]

function WordUniverseFace({ mob, onToast }) {
  const [level, setLevel] = useSW('cet4')
  const [sel, setSel] = useSW([])
  const [recipe, setRecipe] = useSW(null)
  const [lenMode, setLenMode] = useSW('inf')
  const [count, setCount] = useSW(20)
  const [tcount, setTcount] = useSW(10)
  const [sheet, setSheet] = useSW(false)
  const ready = sel.length > 0
  const last = { level: 'cet4', types: ['en_to_zh', 'synonym_choice'], lenLabel: '∞ 无限' }

  const toggle = k => { setRecipe(null); setSel(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]) }
  const toggleFam = (f, on) => { setRecipe(null); setSel(s => { const ks = wuFamTypes(f).filter(t => typeAvail(t.key, level)).map(t => t.key); return on ? [...new Set([...s, ...ks])] : s.filter(x => !ks.includes(x)) }) }
  const pickLevel = k => { setRecipe(null); setLevel(k); setSel(s => s.filter(x => typeAvail(x, k))) }
  const applyRecipe = r => { setRecipe(r.name); setLevel(r.level); setSel(r.types.filter(t => typeAvail(t, r.level))) }
  const begin = mode => onToast(`开始${mode === 'trial' ? '限时试炼' : '自由练'} · ${levelZh(level)} · ${typeSummary(sel)} → buildSession()`)

  return (
    <div className="lx-face">
      <p className="lx-eyebrow"><span className="dot" />单词宇宙练习 · WORD UNIVERSE</p>
      <h1 className="lx-h1" style={mob ? { fontSize: 24 } : undefined}>先圈范围，<em>再挑练法</em></h1>
      <p className="lx-sub">等级 × 题型一次选定，{mob ? '底部开练栏一键开「自由练 / 限时试炼」' : '底部两张卡选「自由练 / 限时试炼」'}。题型仅含<b>背词闭环</b>的识记 / 拼写 / 听辨，退役与考试任务题型不在此处。</p>

      {!mob && last && (
        <div className="lx-resume lx-reveal" style={{ marginTop: 18 }}>
          <span className="ic"><Ic name="clock" s={18} /></span>
          <div className="body"><div className="lab">上次配方 · 一键重开</div><div className="val"><em>{levelZh(last.level)}</em> · {typeSummary(last.types)} · {last.lenLabel}</div></div>
          <button className="go" onClick={() => begin('practice')}>继续</button>
        </div>
      )}

      <div className="lx-step" style={{ marginTop: 20 }}>
        <div className="lx-step-h"><span className="lx-step-n">·</span><span className="lx-step-t">推荐组合</span><span className="lx-step-d">· 一键带入范围与题型</span></div>
        <div className="lx-recipes">{WU_RECIPES.map(r => <button key={r.name} className={`lx-recipe ${recipe === r.name ? 'on' : ''}`} onClick={() => applyRecipe(r)}><b>{r.name}</b><span>{r.sub}</span></button>)}</div>
      </div>

      <div className="lx-step">
        <div className="lx-step-h"><span className="lx-step-n">1</span><span className="lx-step-t">练哪个等级</span><span className="lx-step-d">· 7 个能力档，决定可用题型</span></div>
        <LevelGrid value={level} onPick={pickLevel} mob={mob} />
      </div>

      <div className="lx-step">
        <div className="lx-step-h"><span className="lx-step-n">2</span><span className="lx-step-t">练什么题型</span><span className="lx-step-d">· 识记 / 拼写 / 听辨 · {levelZh(level)} 可用项亮起</span></div>
        <WUTypePicker level={level} selected={sel} onToggle={toggle} onToggleFam={toggleFam} compact={mob} />
      </div>

      {!mob && (
        <div className="lx-step">
          <div className="lx-step-h"><span className="lx-step-n">3</span><span className="lx-step-t">选一种开练</span><span className="lx-step-d">· 同一套范围 → 两种节奏</span></div>
          <div className="lx-launch">
            <div className="lx-lcard practice">
              <div className="glow" />
              <div className="lx-lcard-tag">∞ FREE PRACTICE</div>
              <div className="lx-lcard-h">自由练 <em>Practice</em></div>
              <p className="lx-lcard-p">不计时、不评分。答错加权重出，专注把生词练熟。</p>
              <div className="lx-lcard-cfg">
                <div className="cl">练多久</div>
                <div className="lx-miniseg">{[['inf', '∞ 无限'], ['count', '按题数'], ['time', '按时间']].map(([k, t]) => <button key={k} className={lenMode === k ? 'on' : ''} onClick={() => setLenMode(k)}>{t}</button>)}</div>
                {lenMode === 'count' && <div className="lx-presets" style={{ marginTop: 10 }}>{[10, 20, 50].map(n => <button key={n} className={`lx-pchip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n} 题</button>)}</div>}
              </div>
              <button className="lx-lbtn" disabled={!ready} style={!ready ? { opacity: .5 } : undefined} onClick={() => begin('practice')}>开始自由练 →</button>
            </div>
            <div className="lx-lcard trial">
              <div className="glow" />
              <div className="lx-lcard-tag">✦ TIMED TRIAL</div>
              <div className="lx-lcard-h">限时试炼 <em>Trial</em></div>
              <p className="lx-lcard-p">计时作答、按维度评分，过 80% 点亮星系，错词回流今日。</p>
              <div className="lx-lcard-cfg">
                <div className="cl">题量 · 限时随题量自动合成</div>
                <div className="lx-miniseg">{[6, 10, 12, 20].map(c => <button key={c} className={tcount === c ? 'on' : ''} onClick={() => setTcount(c)}>{c} 题</button>)}</div>
                <div style={{ display: 'flex', gap: 14, marginTop: 11, fontSize: 11.5, color: 'var(--ink-muted)' }}>
                  <span>⏱ 限时 <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--violet-ink)' }}>{Math.max(60, tcount * 16)}s</b></span>
                  <span>🎯 通关 <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal-ink)' }}>80%</b></span>
                </div>
              </div>
              <button className="lx-lbtn" disabled={!ready} style={!ready ? { opacity: .5 } : undefined} onClick={() => begin('trial')}>开始试炼 ✦</button>
            </div>
          </div>
        </div>
      )}

      <div className="lx-banknote"><Ic name="check" s={15} sw={2.4} /><span>单词宇宙题型 <b>13</b> 种 · <b>7</b> 等级，答错的词自动回流「今日」复习。</span></div>

      {/* 移动端 · 悬浮开练坞 + 设置抽屉 */}
      {mob && (
        <>
          <div className="lx-launchdock">
            <div className="lx-dock-resume">
              <span className="ri"><Ic name="clock" s={15} /></span>
              <span className="rl">上次：<em>{levelZh(last.level)}</em> · {typeSummary(last.types)}</span>
              <button className="rg" onClick={() => begin('practice')}><Ic name="play" s={11} sw={2.4} />重开</button>
            </div>
            <div className="lx-launchdock-sum">
              <div className="t"><em>{levelZh(level)}</em> · {typeSummary(sel)}</div>
              <button className="lx-cfgbtn" onClick={() => setSheet(true)}><Ic name="pen" s={13} />调练法</button>
            </div>
            <div className="lx-split">
              <button className="lx-splitbtn practice" disabled={!ready} onClick={() => begin('practice')}><span className="bt"><Ic name="inf" s={16} sw={2.2} />自由练</span><span className="bs">{lenMode === 'inf' ? '∞ 无限' : `${count} 题`}</span></button>
              <button className="lx-splitbtn trial" disabled={!ready} onClick={() => begin('trial')}><span className="bt"><Ic name="bolt" s={15} sw={2.2} />限时试炼</span><span className="bs">{tcount} 题 · 80%过线</span></button>
            </div>
          </div>
          {sheet && (
            <div className="lx-sheet-mask" onClick={e => { if (e.target === e.currentTarget) setSheet(false) }}>
              <div className="lx-sheet">
                <div className="lx-sheet-grab" />
                <h3 className="lx-sheet-h">调练法</h3>
                <div className="lx-sheet-sec">
                  <div className="sl"><span className="d" style={{ background: 'var(--teal)' }} />自由练 · 练多久</div>
                  <div className="lx-seg">{[['inf', '∞ 无限'], ['count', '按题数'], ['time', '按时间']].map(([k, t]) => <button key={k} className={lenMode === k ? 'on' : ''} onClick={() => setLenMode(k)}>{t}</button>)}</div>
                  {lenMode === 'count' && <div className="lx-presets" style={{ marginTop: 11 }}>{[10, 20, 50, 100].map(n => <button key={n} className={`lx-pchip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n} 题</button>)}</div>}
                </div>
                <div className="lx-sheet-sec">
                  <div className="sl"><span className="d" style={{ background: 'var(--violet)' }} />限时试炼 · 题量</div>
                  <div className="lx-seg">{[6, 10, 12, 20].map(c => <button key={c} className={tcount === c ? 'on' : ''} style={tcount === c ? { background: 'var(--violet)' } : undefined} onClick={() => setTcount(c)}>{c} 题</button>)}</div>
                </div>
                <button className="lx-sheet-done" onClick={() => setSheet(false)}>完成</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ════════ 模拟试卷（MockExamPicker 沿用） ════════ */
function MockPaperFace({ mob, onToast }) {
  const [examId, setExamId] = useSW('cet4')
  const exam = getExamSpec(examId)
  const draft = exam.status === 'draft'
  const totalQ = exam.sections.filter(s => s.points >= 0).reduce((s, x) => s + x.itemCount, 0)
  // 客观题板块（排除生产性任务）做整卷
  const objSecs = exam.sections.filter(s => isExamTask(bestTask(exam, s)) || s.taskTypes.some(isExamTask))
  const objPoints = objSecs.reduce((s, x) => s + (x.points || 0), 0)

  return (
    <div className="lx-face face-mock-wrap">
      <p className="lx-eyebrow"><span className="dot" />模拟试卷 · MOCK PAPER</p>
      <h1 className="lx-h1" style={mob ? { fontSize: 24 } : undefined}>整卷限时，<em>真分制评分</em></h1>
      <p className="lx-sub">按各考试<b>真实结构</b>整卷限时；题目由 <b>question_bank</b> 按「任务 × 等级」装配，不含真题版权内容。退役题型不出现，TOEFL / SAT 题库建设中。</p>

      <div className={`lx-exam-grid ${mob ? 'mob' : ''}`} style={{ marginTop: 18 }}>
        {EXAM_SPECS.map(e => (
          <button key={e.id} className={`lx-exam ${examId === e.id ? 'on' : ''} ${e.status === 'draft' ? 'soon' : ''}`} onClick={() => setExamId(e.id)}>
            {e.status === 'draft' && <span className="lx-exam-soon">题库建设中</span>}
            <div className="lx-exam-zh">{e.labelZh}</div>
            <div className="lx-exam-en">{e.labelEn}</div>
            <div className="lx-exam-meta"><span><b>{e.totalMinutes}</b>′</span><span>满分 <b>{e.fullScore}</b></span></div>
          </button>
        ))}
      </div>

      <div className="lx-paper" key={examId} style={{ ['--accent']: 'var(--violet-ink)', ['--accent-bg']: 'var(--violet-bg)', ['--accent-ink']: 'var(--violet-ink)' }}>
        {draft && <div className="lx-soonbanner"><Ic name="pen" s={14} /><span><b>{exam.labelZh} 题库建设中</b> · 以下为规划结构草案；题库就绪后即可一键接入。</span></div>}
        <div className="lx-paper-head">
          <div className="lx-paper-title">{exam.labelZh} · 模拟卷</div>
          <div className="lx-paper-sub">客观题整卷 · 共 {objSecs.length} 个区 · {totalQ} 小题</div>
          <div className="lx-paper-stats">
            <div className="lx-paper-stat"><div className="n">{exam.totalMinutes}′</div><div className="l">建议时长</div></div>
            <div className="lx-paper-stat"><div className="n">{objPoints || '—'}</div><div className="l">客观满分</div></div>
            <div className="lx-paper-stat"><div className="n">{exam.fullScore}</div><div className="l">真卷满分</div></div>
          </div>
        </div>
        <div className="lx-paper-body">
          {exam.sections.map((sec, i) => {
            const tk = bestTask(exam, sec)
            const [zh] = taskLabel(tk)
            const st = deriveTaskState(exam, tk)
            return (
              <div className="lx-paper-sec" key={sec.id}>
                <span className="sn">{i + 1}</span>
                <div className="sbody">
                  <div className="stitle">{sec.labelZh}<em>{sec.labelEn}</em></div>
                  <div className="ssrc">题源 <b>{zh}</b> · {st.state === 'ok' ? <>{fmt(st.count)} 题在库</> : st.state === 'plan' ? <span style={{ color: 'var(--violet-ink)' }}>主观题 · 不计入客观卷</span> : <span style={{ color: 'var(--gold-ink)' }}>待入库 · 建设中</span>} · {GROUP_MODE_ZH[sec.groupMode]}</div>
                </div>
                <div className="smeta"><div className="q">{sec.itemCount} 题</div><div className="p">{sec.points || '—'} 分</div></div>
              </div>
            )
          })}
        </div>
        <div className="lx-paper-skip"><Ic name="pen" s={13} />本卷只做客观题；写作 / 翻译 / 口语等主观题不计入。</div>
      </div>

      {draft ? (
        <button className="lx-cta" disabled style={{ width: '100%', justifyContent: 'center', marginTop: 18, ['--accent']: 'var(--violet-ink)', ['--accent-deep']: 'var(--violet-deep)' }}><Ic name="clock" s={16} />题库建设中 · 敬请期待</button>
      ) : (
        <button className="lx-cta" style={{ width: '100%', justifyContent: 'center', marginTop: 18, ['--accent']: 'var(--violet)', ['--accent-deep']: 'var(--violet-deep)' }} onClick={() => onToast(`开始模拟考 · ${exam.labelZh} · ${exam.totalMinutes} 分钟 → /api/mock-exam`)}><Ic name="bolt" s={17} sw={2} />开始模拟考 · {exam.totalMinutes} 分钟</button>
      )}
    </div>
  )
}

Object.assign(window, { WordUniverseFace, MockPaperFace })
