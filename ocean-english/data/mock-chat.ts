interface MockResponse {
  trigger: string[]
  response: string
}

export const mockAiResponses: MockResponse[] = [
  {
    trigger: ['ubiquitous', '无处不在'],
    response: `**ubiquitous** /juːˈbɪkwɪtəs/

Adjective — meaning: present or found **everywhere**.

📖 Example: *"Social media is ubiquitous in modern life."*

🔤 Etymology: From Latin **ubique** ("everywhere") + **-ous**. Think: "you-big-quit-us" — you can't quit it because it's everywhere!

🧠 Memory tip: ubiquitous = U + BIG + QUIT + OUS. You can't quit it — it's everywhere!

Would you like me to add this word to your review list? Just say **"add to review"**.`,
  },
  {
    trigger: ['ephemeral', '短暂'],
    response: `**ephemeral** /ɪˈfemərəl/

Adjective — meaning: lasting for a very **short time**.

📖 Example: *"The ephemeral beauty of cherry blossoms makes them all the more precious."*

🔤 Etymology: Greek **ephemeros** = epi- ("on") + hemera ("day") — literally lasting only one day.

🧠 邪修记忆法: "一飞没了" — things fly up and immediately disappear.

Synonyms: fleeting, transient, momentary, evanescent`,
  },
  {
    trigger: ['what is', 'explain', 'define', 'meaning of', '什么是', '解释'],
    response: `I can help explain that! Could you tell me more specifically which word or phrase you'd like explained?

For example, you can ask:
- "What is *resilient*?"
- "Explain the word *meticulous*"
- "What's the difference between *affect* and *effect*?"

I'll give you a full breakdown with etymology, examples, and memory tricks! 🌱`,
  },
  {
    trigger: ['quiz', 'test me', 'practice', '练习', '测试'],
    response: `Great idea! Head to the **Quiz** section for interactive practice questions. 📝

I can help you prepare by:
1. Explaining any word you're unsure about
2. Giving you example sentences to analyze
3. Suggesting which words to focus on based on your level

Which words would you like to practice? Tell me your target exam (TOEFL, IELTS, CET-4, CET-6, 考研, 高考) and I'll focus your preparation!`,
  },
  {
    trigger: ['study plan', 'learning plan', '学习计划', 'schedule'],
    response: `Here's a **30-day vocabulary building plan** for intermediate learners:

**Week 1–2: Foundation**
- Learn 5 new words daily from the dictionary
- Review previous day's words each morning
- Complete daily quiz (5 questions)

**Week 3: Consolidation**
- Focus on words you got wrong in quizzes
- Read 1 short article and note unfamiliar words
- Review all words from weeks 1–2

**Week 4: Active Use**
- Use each learned word in a written sentence
- Try the Scan feature with a reading passage
- Final review quiz of all 140 words

💡 **Tip:** The Memory section uses spaced repetition — use it every day for 10 minutes for maximum retention!`,
  },
  {
    trigger: ['toefl', 'ielts', '托福', '雅思'],
    response: `**TOEFL/IELTS Vocabulary Strategy** 📚

Key focus areas:

**Academic vocabulary (AWL)**
Words like: *analyze, concept, establish, evidence, factor, interpret*

**High-frequency TOEFL words**
*ubiquitous, ephemeral, tenacious, pragmatic, meticulous, resilient*

**My recommendations:**
1. Learn 10 academic words per week
2. Practice them in reading context (use Scan feature)
3. Use AI Navigator to get example sentences for each word
4. Take practice quizzes to solidify retention

Head to the **Exam** section to start TOEFL/IELTS preparation! 🎯`,
  },
  {
    trigger: ['add to review', '加入复习', 'save', '保存'],
    response: `I've noted that! Go to the word's detail page in the **Dictionary** and click the **"+ Add to Review"** button to add it to your spaced repetition queue. 🧠

Your review sessions are in the **Memory** section. Words are scheduled based on how well you know them using the SM-2 algorithm.`,
  },
]

export const suggestedPrompts = [
  { label: 'Explain a word', labelZh: '解释单词', prompt: 'What is the meaning of ubiquitous?' },
  { label: 'Make a study plan', labelZh: '制定学习计划', prompt: 'Create a 30-day vocabulary study plan for me.' },
  { label: 'TOEFL tips', labelZh: '托福建议', prompt: 'What vocabulary should I focus on for TOEFL?' },
  { label: 'Word difference', labelZh: '词汇区别', prompt: "What's the difference between 'affect' and 'effect'?" },
  { label: 'Test me', labelZh: '测试我', prompt: 'Quiz me on the words I recently learned.' },
  { label: 'Sentence analysis', labelZh: '句子分析', prompt: "Help me analyze this sentence: 'The ephemeral nature of celebrity is well documented.'" },
]

export function getMockAiResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()
  for (const resp of mockAiResponses) {
    if (resp.trigger.some(t => lower.includes(t.toLowerCase()))) {
      return resp.response
    }
  }
  return `I understand you're asking about: *"${userMessage}"*

As your AI language tutor, I can help with:
- **Word explanations** — definitions, etymology, examples
- **Study plans** — personalized learning schedules
- **Exam preparation** — TOEFL, IELTS, CET-4/6, 考研, 高考
- **Sentence analysis** — grammar and meaning breakdown

Try asking: *"What does [word] mean?"* or *"Make me a study plan for CET-6"* 🌊

(This is a mock AI response. Real AI integration comes in Phase 3!)`
}
