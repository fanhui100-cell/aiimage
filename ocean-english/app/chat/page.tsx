'use client'

/* ════════════════════════════════════════════════════════════════════════
   领航 LexiPilot（界面优化14 · 提示词1）—— 替换 AI Navigator / AI 导学中心
   领航星头部 + 上下文胶囊 + AI/用户气泡（AI 可内嵌词卡 + 内联出题）+ 快捷动作条
   + 输入 pill。真实 AI 走 /api/ai/chat；联动：加入学习 / 内联出题写回 SRS / 词图跳转。
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { useLexiStore, type WordEntry, type DistractorOption } from '@/store/lexiStore'
import { resolveNavigatorContext } from '@/lib/ai-navigator/ai-navigator-context'
import { PROMPT_SHORTCUTS, buildShortcutPrompt } from '@/lib/ai-navigator/ai-navigator-prompts'
import type { AINavigatorContext } from '@/lib/ai-navigator/ai-navigator-types'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import { speakSmart } from '@/lib/pronunciation/word-audio'
import './lexipilot.css'

const speak = (t: string) => { void speakSmart(t, 'us') }
const Star = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6.3 6.3 4 4M18 18l2 2M17.7 6.3 20 4M6 18l-2 2" /><circle cx="12" cy="12" r="4" /></svg>
)

function ctxLabel(c: AINavigatorContext): string | null {
  if (c.type === 'word' || c.type === 'lexigraph_word') return `词 · ${c.word}`
  if (c.type === 'wrong_answer') return `错题 · ${c.word}`
  if (c.type === 'study_goal') return '学习计划'
  return null
}

function ChatInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatMessages = useLexiStore(s => s.chatMessages)
  const addChatMessage = useLexiStore(s => s.addChatMessage)
  const clearChat = useLexiStore(s => s.clearChat)
  const wrongAnswers = useLexiStore(s => s.wrongAnswers)
  const totalXp = useLexiStore(s => s.xp)
  const currentStreak = useLexiStore(s => s.streakData.current)
  const userLevel = useLexiStore(s => s.profile.userLevel ?? null)
  const words = useLexiStore(s => s.words)

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [card, setCard] = useState<DictionaryWord | null>(null)
  const [added, setAdded] = useState(false)
  const [quiz, setQuiz] = useState<{ word: string; wordId: string; options: DistractorOption[]; picked: string | null } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const context = resolveNavigatorContext({ params: searchParams, wrongAnswers, totalXp, currentStreak, words })
  // 词上下文：优先解析后的 context.word；也接受裸 ?word= / ?w=（词图/词详情跳来）
  const bareWord = (searchParams.get('word') ?? searchParams.get('w'))?.trim() || null
  const ctxWord = (context.type === 'word' || context.type === 'lexigraph_word' || context.type === 'wrong_answer') ? context.word : bareWord

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, isTyping, quiz])

  // 界面优化2·P4：外部（AINavigatorPanel 等）用 ?ask= 带问题进来 → 自动发一条，再清掉该参数避免重发
  const askedRef = useRef(false)
  useEffect(() => {
    const ask = searchParams.get('ask')?.trim()
    if (!ask || askedRef.current) return
    askedRef.current = true
    void handleSend(ask)
    const sp = new URLSearchParams(Array.from(searchParams.entries()))
    sp.delete('ask')
    router.replace(sp.toString() ? `/chat?${sp}` : '/chat')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // 上下文词 → 拉词卡（领航开场介绍该词）
  useEffect(() => {
    setCard(null); setAdded(false); setQuiz(null)
    if (!ctxWord) return
    let cancelled = false
    fetch(`/api/dictionary/word/${encodeURIComponent(ctxWord.toLowerCase())}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (!cancelled && j?.data) setCard(j.data as DictionaryWord) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [ctxWord])

  async function handleSend(text?: string) {
    const message = (text ?? input).trim()
    if (!message || isTyping) return
    setInput('')
    addChatMessage({ id: `u-${Date.now()}`, role: 'user', content: message, timestamp: Date.now() })
    setIsTyping(true)
    try {
      const lexi = useLexiStore.getState()
      const today = lexi.getToday()
      const weak = lexi.getWeak().slice(0, 8).map(w => w.word)
      const recentWrong = lexi.wrongAnswers.slice(0, 5).map(w => `${w.word}(答错:${w.userAnswer})`)
      const lv = lexi.profile.level
      const brief = [
        lv != null ? `学习者等级: L${lv}` : null,
        today.all.length ? `今日包: ${today.all.slice(0, 10).map(w => w.word).join(', ')}` : null,
        weak.length ? `薄弱词: ${weak.join(', ')}` : null,
        recentWrong.length ? `最近错题: ${recentWrong.join('; ')}` : null,
      ].filter(Boolean).join('\n')
      const history: { role: string; content: string }[] = []
      if (brief) { history.push({ role: 'user', content: `[学习背景，仅供参考]\n${brief}` }); history.push({ role: 'assistant', content: '好的，我会基于你的学习数据来回答。' }) }
      history.push(...chatMessages.map(m => ({ role: m.role, content: m.content })))
      history.push({ role: 'user', content: message })
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, context: { userLevel: userLevel ?? 'intermediate', language: 'bilingual' } }) })
      const data = (await res.json()) as { content?: string }
      const responseText = res.ok && data.content ? data.content : 'AI 服务暂时不可用，请稍后重试。（你的消息已保留，重新发送即可）'
      addChatMessage({ id: `a-${Date.now()}`, role: 'assistant', content: responseText, timestamp: Date.now() })
    } catch {
      addChatMessage({ id: `a-${Date.now()}`, role: 'assistant', content: '无法连接 AI 服务，请检查网络后重试。', timestamp: Date.now() })
    } finally { setIsTyping(false) }
  }

  // 词卡动作
  function addWord() {
    if (!card) return
    const lexi = useLexiStore.getState()
    lexi.ensureWord(card, 'lookup'); lexi.recordActivity('learned'); setAdded(true)
  }
  function makeQuiz() {
    if (!card) return
    const lexi = useLexiStore.getState()
    const zh = card.definitions?.[0]?.definitionZh ?? card.definitions?.[0]?.definitionEn ?? ''
    const entry = (lexi.byId(card.id) ?? { id: card.id, word: card.word, zh, phon: card.phoneticIpa ?? '', pos: card.partOfSpeech ?? '', galaxy: '', state: 'recommended', streak: 0, ease: 2.5, interval: 0, addedAt: Date.now(), source: 'lookup' }) as WordEntry
    const options = lexi.distractorsFor(entry)
    if (options.length >= 2) setQuiz({ word: card.word, wordId: card.id, options, picked: null })
  }
  function answerQuiz(opt: DistractorOption) {
    if (!quiz || quiz.picked) return
    setQuiz({ ...quiz, picked: opt.id })
    const lexi = useLexiStore.getState()
    lexi.recordActivity('quizzed')
    if (opt.correct) {
      lexi.incXp(10); if (lexi.byId(quiz.wordId)) lexi.markCorrect(quiz.wordId)
    } else {
      if (lexi.byId(quiz.wordId)) lexi.markWrong(quiz.wordId)
      const correct = quiz.options.find(o => o.correct)
      lexi.addWrongAnswer({ wordId: quiz.wordId, word: quiz.word, question: `"${quiz.word}" 的意思是？`, userAnswer: opt.text, correctAnswer: correct?.text ?? '', explanation: '', timestamp: Date.now() })
    }
  }

  const shortcuts = PROMPT_SHORTCUTS.filter(s => !s.disabled && s.enabledFor.includes(context.type))
  const cardZh = card?.definitions?.[0]?.definitionZh ?? ''
  const cardEn = card?.definitions?.[0]?.definitionEn ?? ''
  const cardEx = card?.examples?.[0]

  return (
    <div className="lp-v2">
      {/* 头部 */}
      <div className="pilot-head">
        <div className="pilot-avatar"><Star s={18} /></div>
        <div className="pilot-id">
          <div className="pilot-name">领航 <em>LexiPilot</em></div>
          <div className="pilot-sub"><span className="pilot-live" /> 在线 · 你的单词宇宙副驾</div>
        </div>
        {chatMessages.length > 0 && (
          <button className="head-btn" onClick={clearChat}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
            清空
          </button>
        )}
      </div>

      {/* 上下文胶囊 */}
      {(ctxLabel(context) ?? (ctxWord ? `词 · ${ctxWord}` : null)) && (
        <div className="ctx-bar">
          <span className="ctx-chip">{ctxLabel(context) ?? `词 · ${ctxWord}`}
            <button className="x" title="清除上下文" onClick={() => router.push('/chat')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </span>
        </div>
      )}

      {/* 消息区 */}
      <div className="pilot-scroll">
        <div className="thread">
          {chatMessages.length === 0 && (
            <div className="msg">
              <div className="msg-av"><Star s={15} /></div>
              <div className="bubble">
                <div>{ctxWord ? `一起来探索单词 “${ctxWord}” 吧。` : '我是领航——问词义、辨近义、解词根，或让我出一道题。'}</div>
                {card && (
                  <div className="wordcard">
                    <div className="wc-top">
                      <span className="wc-word">{card.word}</span>
                      {card.phoneticIpa && <span className="wc-phon">{card.phoneticIpa}</span>}
                      <button className="wc-speak" onClick={() => speak(card.word)} title="朗读"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg></button>
                    </div>
                    <div className="wc-pos">
                      {card.partOfSpeech && <span className="wc-tag">{card.partOfSpeech}</span>}
                      {card.cefrLevel && <span className="wc-tag">CEFR {card.cefrLevel}</span>}
                      {(card.examTags ?? []).slice(0, 2).map(t => <span key={t} className="wc-tag">{t}</span>)}
                    </div>
                    {(cardEn || cardZh) && <div className="wc-def">{cardEn}{cardEn && cardZh ? ' · ' : ''}<b style={{ color: 'var(--ink-sub)', fontWeight: 400 }}>{cardZh}</b></div>}
                    {cardEx?.sentenceEn && <div className="wc-ex">{hl(cardEx.sentenceEn, card.word)}{cardEx.sentenceZh ? <span style={{ display: 'block', fontStyle: 'normal', color: 'var(--ink-muted)' }}>{cardEx.sentenceZh}</span> : null}</div>}
                    <div className="wc-actions">
                      <button className={`chip-btn ${added ? 'done' : 'solid'}`} onClick={addWord} disabled={added}>{added ? '✓ 已加入学习' : '+ 加入学习'}</button>
                      <button className="chip-btn" onClick={makeQuiz}>出一道题</button>
                      <button className="chip-btn" onClick={() => router.push(`/lexigraph?w=${encodeURIComponent(card.word)}`)}>看词图 →</button>
                    </div>
                    {quiz && (
                      <div className="inq">
                        <div className="inq-q">“{quiz.word}” 的意思是？</div>
                        {quiz.options.map(o => {
                          const cls = quiz.picked ? (o.correct ? 'correct' : (quiz.picked === o.id ? 'wrong' : '')) : ''
                          return <button key={o.id} className={`inq-opt ${cls}`} disabled={!!quiz.picked} onClick={() => answerQuiz(o)}>{o.text}</button>
                        })}
                        {quiz.picked && <div className="inq-fb" style={{ color: quiz.options.find(o => o.id === quiz.picked)?.correct ? 'var(--teal-ink)' : 'var(--rose-ink)' }}>{quiz.options.find(o => o.id === quiz.picked)?.correct ? '✓ 答对了，已计入掌握' : '✗ 答错了，已存入错词本'}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {chatMessages.map(m => (
            <div key={m.id} className={`msg ${m.role === 'user' ? 'user' : ''}`}>
              {m.role !== 'user' && <div className="msg-av"><Star s={15} /></div>}
              <div className="bubble">{m.content.split('**').map((p, i) => i % 2 === 1 ? <b key={i}>{p}</b> : p)}</div>
            </div>
          ))}

          {isTyping && <div className="typing"><span /><span /><span /></div>}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 快捷动作 + 输入 */}
      <div className="composer">
        <div className="composer-inner">
          <div className="quick-row">
            {shortcuts.map(sc => (
              <button key={sc.id} className="quick" disabled={isTyping}
                onClick={() => {
                  const p = buildShortcutPrompt(sc.id, context)
                  if (!p) return
                  if (sc.fillOnly) { setInput(p); inputRef.current?.focus() } else handleSend(p)
                }}>
                {sc.labelZh}
              </button>
            ))}
          </div>
          <div className="input-row">
            <div className="input-pill">
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
                placeholder="提问单词、语法或考试相关问题…" />
            </div>
            <button className="send-btn" disabled={!input.trim() || isTyping} onClick={() => handleSend()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function hl(sentence: string, word: string): React.ReactNode[] {
  const re = new RegExp('\\b(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*)\\b', 'ig')
  const out: React.ReactNode[] = []; let last = 0; let m: RegExpExecArray | null; let k = 0
  while ((m = re.exec(sentence))) { out.push(sentence.slice(last, m.index)); out.push(<b key={k++}>{m[0]}</b>); last = m.index + m[0].length }
  out.push(sentence.slice(last)); return out
}

export default function ChatPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="lp-v2" style={{ alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'var(--ink-sub)', fontSize: 13 }}>加载中…</div></div>}>
        <ChatInner />
      </Suspense>
    </AppShell>
  )
}
