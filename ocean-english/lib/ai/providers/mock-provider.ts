import type { AIProvider } from '../ai-provider'
import type {
  AIMessage,
  AIRequestContext,
  AIResponse,
  WordExplanationRequest,
  QuizGenerationRequest,
  MistakeAnalysisRequest,
  StudyPlanRequest,
} from '@/types/ai'

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function mockResponse(content: string): AIResponse {
  return { content, provider: 'mock', cached: false }
}

// ── Chat responses ─────────────────────────────────────────────────────────

function buildChatResponse(lastMessage: string, level: string): string {
  const msg = lastMessage.toLowerCase()

  const wordMatch = msg.match(
    /(?:what does?|explain|meaning of|define|tell me about)\s+["']?([a-z-]+)["']?/i,
  )
  if (wordMatch) return wordChatResponse(wordMatch[1], level)

  if (msg.includes('grammar') || msg.includes('tense') || msg.includes('sentence structure')) {
    return grammarResponse(level)
  }
  if (
    msg.includes('toefl') ||
    msg.includes('ielts') ||
    msg.includes('cet') ||
    msg.includes('exam') ||
    msg.includes('test')
  ) {
    return examResponse(level)
  }
  if (
    msg.includes('quiz') ||
    msg.includes('practice') ||
    msg.includes('test me') ||
    msg.includes('练习')
  ) {
    return quizChallengeResponse(level)
  }
  if (
    msg.includes('improve') ||
    msg.includes('how to') ||
    msg.includes('tips') ||
    msg.includes('怎么') ||
    msg.includes('建议')
  ) {
    return studyTipsResponse(level)
  }

  return generalResponse(level)
}

function wordChatResponse(word: string, level: string): string {
  const levelNote =
    level === 'beginner' || level === 'elementary'
      ? 'This is a great word to learn at your stage!'
      : level === 'exam-prep'
        ? 'This word frequently appears in TOEFL and academic writing.'
        : 'Understanding this word will strengthen your vocabulary significantly.'

  return `**${word}** — let me explain this for you! / 来解释一下这个词！

**Core Meaning / 核心含义**
This is a commonly used English word that carries important meaning in academic and everyday contexts. ${levelNote}
这是一个常用英语词汇，在学术和日常语境中都很重要。

**How to use it / 用法示例**
• The concept of **${word}** is central to understanding this topic.
  **${word}** 的概念对理解这个主题至关重要。
• Experts often discuss **${word}** when analyzing complex situations.
  专家在分析复杂情况时经常讨论 **${word}**。

**Memory Tip / 记忆方法**
Break the word into parts and associate it with something familiar. Practice using it in one sentence today.
将单词拆分成部分，与熟悉的事物联想。今天就用它造一个句子练习吧！

💡 *Go to the Dictionary to see the full entry for "${word}" with etymology and mnemonics.*
*访问词典查看"${word}"的完整词条，包括词源和记忆法。*`
}

function grammarResponse(level: string): string {
  const examples =
    level === 'beginner' || level === 'elementary'
      ? `**Present vs. Past Tense / 现在时 vs. 过去时**
• I **study** English every day. (present habit / 现在习惯)
• I **studied** English yesterday. (completed action / 完成动作)`
      : `**Subjunctive Mood / 虚拟语气**
• If I **were** you, I would practice daily. (hypothetical / 假设)
• She wishes she **could** speak English fluently. (desire / 愿望)`

  return `**Grammar Focus / 语法重点**

English grammar builds on patterns. Here's a key one for your level:

${examples}

**Quick Rule / 核心规则**
Identify the time frame first (now / past / future / hypothetical), then choose the correct tense or mood.
先确定时间框架（现在/过去/将来/假设），再选择正确的时态或语气。

**Practice / 练习**
Try completing this sentence: "If I had more time, I _______ (study/studied/would study) more."
练习完成这个句子，巩固理解。

*Answer: would study — this is the conditional form.*`
}

function examResponse(level: string): string {
  return `**Exam Strategy / 考试策略**

${level === 'exam-prep' ? 'Great focus! Here are targeted strategies:' : 'Exam preparation requires strategic thinking:'}
${level === 'exam-prep' ? '针对考试备考，以下是重点策略：' : '考试备考需要有策略地学习：'}

**Vocabulary / 词汇**
• Learn 10–15 high-frequency words per day from official word lists
  每天学习 10-15 个高频词汇（来自官方词汇表）
• Focus on words with multiple meanings and academic collocations
  重点掌握一词多义和学术搭配

**Reading / 阅读**
• Practice skimming for main ideas (30 sec per paragraph)
  练习快速浏览抓主旨（每段 30 秒）
• Identify question types: detail, inference, main idea, vocabulary-in-context
  识别题型：细节题、推断题、主旨题、语境词汇题

**Time Management / 时间管理**
• Simulate full exam conditions weekly
  每周模拟完整考试环境
• Track your weak areas and allocate extra practice time there
  追踪薄弱项，分配额外练习时间

💡 Use the **Exam Branch** module in Lexiverse for targeted practice questions.
使用 Lexiverse 的**考试枝路**模块进行专项练习。`
}

function quizChallengeResponse(level: string): string {
  const questions =
    level === 'beginner' || level === 'elementary'
      ? [
          'What is the opposite of "big"? (a) small (b) fast (c) tall → Answer: (a) small / 答案：(a) small',
          'Fill in: "She ___ to school every day." (go/goes/went) → Answer: goes / 答案：goes',
        ]
      : [
          'What does "ephemeral" mean? (a) eternal (b) short-lived (c) famous (d) colorful → Answer: (b) / 答案：(b) short-lived 短暂的',
          '"Despite her ______ schedule, she always found time to read." (demanding/demanded/demand) → Answer: demanding / 答案：demanding',
        ]

  return `**Quick Quiz / 快速测验** 🎯

Let's test your knowledge! Try these questions:
来测试一下你的知识！试试这些题目：

**Q1:** ${questions[0]}

**Q2:** ${questions[1]}

**How did you do? / 你做得怎么样？**
• Both correct: Excellent! Push to the next level. 全对：优秀！向下一级挑战。
• One correct: Good effort! Review the tricky one. 对一个：不错！复习那个难题。
• Neither: That's okay — check the Dictionary and try again. 都错：没关系——查词典再试。

💡 Head to the **Quiz** module for a full vocabulary challenge.
前往**练习模式**进行完整词汇挑战。`
}

function studyTipsResponse(level: string): string {
  return `**Study Tips / 学习建议** for ${level} level

**The 3-Layer Method / 三层学习法**
1. **Encounter** — See the word in context (reading, listening) / 在语境中遇到单词
2. **Analyze** — Look up definition, etymology, examples / 分析词义、词源、例句
3. **Produce** — Use it in writing or speaking / 主动使用：写作或口语

**Daily Habit / 每日习惯**
• Morning: Review 5 flashcards (5 min) / 早晨：复习 5 张单词卡（5 分钟）
• Midday: Read one English article or paragraph / 午间：阅读一篇英语文章或段落
• Evening: Write 2–3 sentences using today's new words / 晚间：用今天的新词造 2-3 个句子

**Spaced Repetition / 间隔复习**
Don't cram — review words at increasing intervals: 1 day → 3 days → 1 week → 1 month.
不要死记硬背——按递增间隔复习：1天→3天→1周→1个月。

💡 Lexiverse's **Memory Roots** module handles spaced repetition automatically.
Lexiverse 的**记忆根系**模块自动管理间隔复习。`
}

function generalResponse(level: string): string {
  return `**Lexiverse AI Tutor / AI 导学** 🌊

Hello! I'm your AI English learning companion. I can help you with:
你好！我是你的 AI 英语学习伙伴。我可以帮助你：

• **Word explanations** / 单词解释 — Ask "What does [word] mean?"
• **Grammar questions** / 语法问题 — Ask about tenses, sentence structure, usage
• **Exam strategies** / 考试策略 — TOEFL, IELTS, CET-4/6, 考研, 高考
• **Study tips** / 学习建议 — How to build vocabulary and retain it
• **Quick quizzes** / 快速测验 — Say "Quiz me" to practice

Your current level: **${level}**
你的当前等级：**${level}**

What would you like to explore today?
今天你想探索什么？`
}

// ── Word explanation ───────────────────────────────────────────────────────

function buildWordExplanationContent(req: WordExplanationRequest): string {
  const { word, userLevel = 'intermediate' } = req

  const levelNote: Record<string, string> = {
    beginner: 'Great word for beginners to master! / 非常适合初学者掌握的词！',
    elementary: 'Building this into your vocabulary will open many doors. / 掌握这个词将开启更多可能。',
    intermediate: 'This word will significantly elevate your English. / 这个词将显著提升你的英语水平。',
    advanced: 'A nuanced word worth understanding deeply. / 一个值得深入理解的细腻词汇。',
    'exam-prep': 'High-frequency word in TOEFL, IELTS, and academic writing. / 托福、雅思及学术写作高频词。',
    'free-explore': 'An interesting word with rich history and usage. / 一个有丰富历史和用法的有趣词汇。',
  }

  return `**${word}**

**Meaning / 含义**
A significant English word used across academic, professional, and everyday contexts.
一个在学术、专业和日常语境中广泛使用的重要英语词汇。

**Examples / 例句**
• The ability to adapt is one of the most valuable qualities a person can have.
  适应能力是一个人最宝贵的品质之一。
• Understanding **${word}** deeply will help you read and write more naturally.
  深入理解 **${word}** 将帮助你更自然地阅读和写作。

**Study Tip / 学习建议**
${levelNote[userLevel] ?? levelNote.intermediate}
Try using this word in a sentence right now — active use is the fastest path to retention.
现在就试着用这个词造一个句子——主动使用是最快的记忆方式。

*— Lexiverse AI Tutor (Mock Mode — real AI coming in Phase 3)*`
}

// ── Quiz generation ────────────────────────────────────────────────────────

function buildQuizContent(req: QuizGenerationRequest): string {
  const words = req.words.slice(0, 3)
  const questions = words.map((word, i) => ({
    id: `mock-q${i + 1}`,
    wordId: word.toLowerCase().replace(/\s+/g, '-'),
    word,
    question: `Which of the following best describes the meaning of "${word}"?`,
    options: [
      { id: 'a', text: `The primary meaning of ${word}` },
      { id: 'b', text: `A related but incorrect definition` },
      { id: 'c', text: `An unrelated concept` },
      { id: 'd', text: `The antonym of ${word}` },
    ],
    correctAnswer: 'a',
    explanation: `Option A correctly captures the core meaning of "${word}".`,
    explanationZh: `选项 A 准确表达了"${word}"的核心含义。`,
  }))

  return JSON.stringify(questions, null, 2)
}

// ── Mistake analysis ───────────────────────────────────────────────────────

function buildMistakeAnalysisContent(req: MistakeAnalysisRequest): string {
  const count = req.wrongAnswers.length
  const words = req.wrongAnswers.slice(0, 5).map(w => w.word).join(', ')

  return `**Pattern Analysis / 错题模式分析**
After reviewing your ${count} wrong answer${count !== 1 ? 's' : ''}, here are the key patterns:
分析你的 ${count} 道错题后，以下是主要模式：

• **Vocabulary precision** — Confusing similar-sounding or similar-meaning words
  词汇精确性——混淆读音或含义相近的词汇
• **Context sensitivity** — Missing how meaning shifts based on context
  语境敏感性——忽略词义随语境变化的方式
• **Part-of-speech awareness** — Confusing noun/verb/adjective forms of the same root
  词性意识——混淆同一词根的名词/动词/形容词形式

**Root Causes / 根本原因**
• Insufficient exposure to these words in varied contexts / 在多样化语境中接触这些词汇不足
• Over-reliance on first meaning encountered, not considering alternatives / 过度依赖首次遇到的含义

**Action Plan / 改进计划**
• Review each wrong word using the Dictionary's etymology and mnemonic sections
  使用词典的词源和记忆法部分复习每个错词
• Add all missed words to your Review Queue via "+ Review" button
  通过"+ 复习"按钮将所有错词加入复习队列
• Retake the quiz on just these words in 24 hours
  24小时后仅针对这些词重新测验

**Priority Words / 重点复习单词**
${words || 'Review your most recent wrong answers'}

*— Lexiverse AI Tutor (Mock Mode)*`
}

// ── Study plan ─────────────────────────────────────────────────────────────

function buildStudyPlanContent(req: StudyPlanRequest): string {
  const level = req.userLevel ?? 'intermediate'
  const daily = req.dailyGoal ?? 10
  const words = req.savedWordCount

  return `**Study Plan / 学习计划** — ${level} level, ${daily} min/day

**Weekly Overview / 每周概览**
Week 1: Foundation — Master your ${Math.min(words, 20)} saved words + add 10 new ones
       基础巩固——掌握已保存的 ${Math.min(words, 20)} 个单词 + 新增10个
Week 2: Expansion — Introduce vocabulary by theme (academic, daily life, exam)
       词汇扩展——按主题学习（学术、日常生活、考试）
Week 3: Application — Focus on reading and using words in sentences
       实际应用——专注阅读并在句子中使用词汇
Week 4: Consolidation — Quiz all words, strengthen weak areas
       全面巩固——测验所有单词，强化薄弱项

**Daily Routine / 每日安排** (${daily} min total)
• Morning review: 5 flashcards from Review Queue (3 min) / 早晨复习：5张复习卡（3分钟）
• New word study: 1–2 words with full dictionary entry (4 min) / 新词学习：1-2个完整词条（4分钟）
• Practice: 1 quiz question or write 1 sentence (3 min) / 练习：1道测验题或造1个句子（3分钟）

**Focus Areas / 重点攻克**
${req.weakAreas?.length ? `Target: ${req.weakAreas.join(', ')} — dedicate extra review sessions to these` : 'Use your Wrong Answers notebook to identify weak spots as you progress'}
${req.weakAreas?.length ? `重点：${req.weakAreas.join('、')} — 为这些薄弱项安排额外复习` : '利用错题本随着学习进展识别薄弱点'}

**Milestones / 里程碑**
• End of Week 1: Recall all saved words without hints / 第一周末：无提示回忆所有已保存单词
• End of Week 2: Understand 30+ words in reading context / 第二周末：在阅读语境中理解30+个词
• End of Week 4: Quiz score above 80% consistently / 第四周末：测验分数持续超过80%

*— Lexiverse AI Tutor (Mock Mode — real AI planning in Phase 3)*`
}

// ── Provider class ─────────────────────────────────────────────────────────

export class MockProvider implements AIProvider {
  readonly name = 'mock' as const

  async chat(messages: AIMessage[], context: AIRequestContext): Promise<AIResponse> {
    await delay(700 + Math.random() * 500)
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    const level = context.userLevel ?? 'intermediate'
    return mockResponse(buildChatResponse(lastUserMsg, level))
  }

  async complete(messages: AIMessage[]): Promise<AIResponse> {
    await delay(500 + Math.random() * 300)
    const last = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    return mockResponse(last ? `（mock）${last.slice(0, 200)}` : '（mock）')
  }

  async explainWord(request: WordExplanationRequest): Promise<AIResponse> {
    await delay(500 + Math.random() * 300)
    return mockResponse(buildWordExplanationContent(request))
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<AIResponse> {
    await delay(600 + Math.random() * 400)
    return mockResponse(buildQuizContent(request))
  }

  async analyzeMistakes(request: MistakeAnalysisRequest): Promise<AIResponse> {
    await delay(800 + Math.random() * 400)
    return mockResponse(buildMistakeAnalysisContent(request))
  }

  async generateStudyPlan(request: StudyPlanRequest): Promise<AIResponse> {
    await delay(900 + Math.random() * 400)
    return mockResponse(buildStudyPlanContent(request))
  }
}
