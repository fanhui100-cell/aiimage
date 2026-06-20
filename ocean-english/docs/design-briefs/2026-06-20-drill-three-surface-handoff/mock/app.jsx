/* app.jsx — Drill 三面重排 外壳：顶部三面切换 + 智能复习细 entry + 桌面/移动预览 */
const { useState: useSA, useEffect: useEA, useLayoutEffect: useLA, useRef: useRA } = React

const SURFACES = [
  { key: 'universe', cls: 'universe', ic: 'planet', st: '单词宇宙练习', stShort: '单词宇宙', sd: '背词闭环 · 练/测' },
  { key: 'exam', cls: 'exam', ic: 'target', st: '考试专项', stShort: '考试专项', sd: '真实结构 · 任务级' },
  { key: 'mock', cls: 'mock', ic: 'layers', st: '模拟试卷', stShort: '模拟试卷', sd: '整卷限时 · 真分制' },
]

function SurfaceSwitch({ surface, setSurface, mob }) {
  const ref = useRA(null)
  const [thumb, setThumb] = useSA({ left: 5, width: 0 })
  useLA(() => {
    const root = ref.current; if (!root) return
    const btn = root.querySelector(`button[data-s="${surface}"]`)
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [surface, mob])
  return (
    <div className="lx-surfacesw v2" ref={ref} role="tablist" aria-label="练习面切换">
      <span className="thumb" style={{ left: thumb.left, width: thumb.width }} />
      {SURFACES.map(s => (
        <button key={s.key} data-s={s.key} role="tab" aria-selected={surface === s.key}
          className={`${s.cls} ${surface === s.key ? 'on' : ''}`} onClick={() => setSurface(s.key)}>
          <span className="st"><span className="si"><Ic name={s.ic} s={15} sw={1.9} /></span>{mob ? s.stShort : s.st}</span>
          <span className="sd">{s.sd}</span>
        </button>
      ))}
    </div>
  )
}

function ReviewEntry({ onGo }) {
  return (
    <button className="lx-reviewentry" onClick={onGo}>
      <span className="ri"><Ic name="clock" s={18} /></span>
      <span className="rb">
        <span className="rt">智能复习 <em>Smart Review</em></span>
        <span className="rd">按记忆曲线优先练该练的 · 到期 / 错题 / 薄弱一处清 → /memory</span>
      </span>
      <span className="rcounts">
        <span className="rcount">28 到期</span>
        <span className="rcount gold">12 错题</span>
      </span>
      <span className="rgo"><Ic name="arrowright" s={17} sw={2} /></span>
    </button>
  )
}

function DrillConfig({ mob }) {
  const [surface, setSurface] = useSA('exam')
  const [toast, setToast] = useSA('')
  const onToast = msg => setToast(msg)
  const onLaunch = (exam, section, taskType) => setToast(`→ /quiz?mode=task&examId=${exam.id}&taskType=${taskType}&level=${exam.level}`)
  const onReview = () => setToast('→ /memory · 智能复习（到期 / 错题 / 薄弱）')

  return (
    <div className={`lx ${mob ? 'phone' : ''} ${surface === 'exam' ? 'face-exam' : ''}`}>
      <Aurora />
      {mob && <MobileChrome active="drill" drillBadge={40} />}
      <div className="lx-scroll">
        <div className={mob ? 'lx-pad' : 'lx-pad-d'} style={mob ? { paddingTop: 64, paddingBottom: surface === 'universe' ? 210 : 40 } : { paddingTop: 64 }}>
          <ReviewEntry onGo={onReview} />
          <SurfaceSwitch surface={surface} setSurface={setSurface} mob={mob} />
          <div style={{ marginTop: 18 }}>
            {surface === 'universe' && <WordUniverseFace mob={mob} onToast={onToast} />}
            {surface === 'exam' && <ExamSpecialtyFace mob={mob} onLaunch={onLaunch} />}
            {surface === 'mock' && <MockPaperFace mob={mob} onToast={onToast} />}
          </div>
        </div>
      </div>
      <Toast msg={toast} onDone={() => setToast('')} />
    </div>
  )
}

function App() {
  const [view, setView] = useSA('desktop')
  return (
    <>
      <div className="dx-bar">
        <span className="dx-label">/drill · Phase 6</span>
        <button className={view === 'desktop' ? 'on' : ''} onClick={() => setView('desktop')}><Ic name="grid" s={14} />桌面</button>
        <button className={view === 'mobile' ? 'on' : ''} onClick={() => setView('mobile')}><Ic name="user" s={14} />移动</button>
      </div>
      <div className="dx-host">
        {view === 'desktop'
          ? <div className="dx-desktop"><DrillConfig mob={false} /></div>
          : <div className="dx-phone"><div className="dx-phone-notch" /><div className="dx-phone-screen"><DrillConfig mob={true} /></div></div>}
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
