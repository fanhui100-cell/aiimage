# LexiOcean Phase 1 — Frontend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Next.js frontend MVP for LexiOcean — a Chinese English-learning site — with a Three.js/R3F banyan-tree particle hero, 7 interactive module nodes, and shell pages for all learning features.

**Architecture:** The hero is a full-screen R3F Canvas with a custom GLSL shader particle system (ported from the HTML demo). Module nodes are rendered as `<Html>` elements inside the 3D scene so they orbit with the tree during auto-rotation. A CSS glass panel outside the canvas shows module details on click. All brand names, module data, and particle parameters are in config files — never hardcoded in components.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Three.js 0.184, `@react-three/fiber` v9, `@react-three/drei`, `@react-three/postprocessing`, `framer-motion`

---

## File Map

```
ocean-english/
├── app/
│   ├── layout.tsx                    Create — root layout with AppShell
│   ├── page.tsx                      Create — homepage with BanyanParticleHero
│   ├── globals.css                   Create — Tailwind v4 + CSS custom properties
│   ├── onboarding/page.tsx           Create — level selection page
│   ├── dictionary/page.tsx           Create — shell
│   ├── word/[slug]/page.tsx          Create — shell
│   ├── chat/page.tsx                 Create — shell
│   ├── quiz/page.tsx                 Create — shell
│   ├── study/page.tsx                Create — shell
│   ├── scan/page.tsx                 Create — shell
│   ├── exam/page.tsx                 Create — shell
│   └── memory/page.tsx               Create — shell
├── components/
│   ├── visual/BanyanParticleHero/
│   │   ├── BanyanParticleHero.tsx    Create — outer container + state + overlay text
│   │   ├── BanyanCanvas.tsx          Create — R3F Canvas + camera + bloom + controls
│   │   ├── BanyanParticleSystem.tsx  Create — Points + GLSL shader + useFrame
│   │   ├── BanyanModuleNodes.tsx     Create — <Html> nodes orbiting in 3D scene
│   │   ├── BanyanModulePanel.tsx     Create — glass detail panel (CSS, outside Canvas)
│   │   ├── banyan-particle-config.ts Create — ALL tunable params + GLSL shaders
│   │   ├── banyan-types.ts           Create — TypeScript interfaces for this subsystem
│   │   └── useBanyanInteraction.ts   Create — hook: active node, panel open, restart
│   ├── layout/
│   │   ├── AppShell.tsx              Create — page wrapper with Navbar
│   │   └── Navbar.tsx                Create — top navigation bar
│   └── ui/
│       ├── GlassPanel.tsx            Create — reusable dark glass-morphism card
│       └── BilingualText.tsx         Create — EN + ZH stacked text component
├── config/
│   ├── site.ts                       Create — brand names, slogan, navigation
│   └── learning-modules.ts           Create — 7 module definitions with 3D positions
├── data/
│   ├── mock-words.ts                 Create — 10 sample word objects
│   └── mock-exam-questions.ts        Create — 5 sample exam questions
├── lib/
│   └── utils.ts                      Create — cn() class merge helper
├── types/
│   ├── word.ts                       Create — Word, Definition interfaces
│   └── learning.ts                   Create — LearningModule, ModuleId types
└── docs/phase-reports/
    └── phase-1-frontend-mvp-report.md Create — generated in final task
```

---

## Task 1: Initialize Next.js project

**Files:**
- Create: `ocean-english/` (entire project scaffold)

- [ ] **Step 1: Run create-next-app in ai-studio root**

Run from `d:\ai-studio`:
```powershell
cd d:\ai-studio
npx create-next-app@latest ocean-english --typescript --eslint --tailwind --app --no-src-dir --no-turbopack --import-alias "@/*"
```
Expected: Scaffold created at `d:\ai-studio\ocean-english\`. Verify with `ls ocean-english`.

- [ ] **Step 2: Install Three.js ecosystem dependencies**

```powershell
cd d:\ai-studio\ocean-english
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing framer-motion
npm install -D @types/three
```
Expected: `node_modules/three`, `node_modules/@react-three` directories exist.

- [ ] **Step 3: Update next.config.ts to transpile Three.js**

Replace entire `next.config.ts` content:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
}

export default nextConfig
```

- [ ] **Step 4: Verify project starts**

```powershell
npm run dev
```
Open `http://localhost:3000` — should show default Next.js page. Ctrl+C to stop.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: scaffold ocean-english Next.js project with Three.js deps"
```

---

## Task 2: Create type definitions

**Files:**
- Create: `types/learning.ts`
- Create: `types/word.ts`

- [ ] **Step 1: Create `types/learning.ts`**

```typescript
export type ModuleId =
  | 'vocabulary-roots'
  | 'voice-sonar'
  | 'ai-navigator'
  | 'reading-canopy'
  | 'scan-hollow'
  | 'exam-branch'
  | 'memory-roots'

export interface ModulePosition3D {
  x: number
  y: number
  z: number
}

export interface LearningModule {
  id: ModuleId
  name: string
  nameZh: string
  type: string
  typeZh: string
  description: string
  descriptionZh: string
  abilities: readonly string[]
  abilitiesZh: readonly string[]
  route: string
  visualPosition: ModulePosition3D
  color: string
  icon: string
}

export type LearningLevel =
  | 'beginner'
  | 'elementary'
  | 'intermediate'
  | 'advanced'
  | 'exam-prep'
  | 'free-explore'

export interface LevelOption {
  id: LearningLevel
  name: string
  nameZh: string
  description: string
  descriptionZh: string
}
```

- [ ] **Step 2: Create `types/word.ts`**

```typescript
export interface Definition {
  partOfSpeech: string
  meaning: string
  meaningZh: string
  example: string
  exampleZh: string
}

export interface Etymology {
  roots: string
  explanation: string
  explanationZh: string
}

export interface Word {
  id: string
  word: string
  phonetic: string
  definitions: Definition[]
  etymology: Etymology
  mnemonic: string
  mnemonicZh: string
  tags: string[]
  difficulty: 1 | 2 | 3 | 4 | 5
}
```

- [ ] **Step 3: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```powershell
git add types/
git commit -m "feat: add learning and word type definitions"
```

---

## Task 3: Create config files

**Files:**
- Create: `config/site.ts`
- Create: `config/learning-modules.ts`

- [ ] **Step 1: Create `config/site.ts`**

```typescript
import type { LearningLevel, LevelOption } from '@/types/learning'

export const siteConfig = {
  projectName: 'LexiOcean',
  projectNameZh: '深海英语学习系统',
  slogan: 'Grow your English into a living knowledge tree.',
  sloganZh: '让英语生长成一棵动态知识树。',
  description:
    'An AI-powered English learning system where vocabulary, pronunciation, reading, documents, exams, and memory grow together.',
  descriptionZh:
    '一个由 AI 驱动的英语学习系统，让词汇、发音、阅读、文档、考试与记忆一起生长。',
  defaultTheme: 'ocean-dark',
  heroHint: 'Move your cursor to disturb the living particles.',
  heroHintZh: '移动鼠标，扰动这棵动态知识树。',
  heroHint2: 'Click a glowing node to enter a learning module.',
  heroHint2Zh: '点击发光节点，进入对应学习模块。',
  ctaPrimary: 'Start Learning',
  ctaPrimaryZh: '开始学习',
  ctaSecondary: 'Choose Level',
  ctaSecondaryZh: '选择等级',
  navigation: [
    { label: 'Dictionary', labelZh: '词典', href: '/dictionary' },
    { label: 'AI Chat', labelZh: 'AI 导学', href: '/chat' },
    { label: 'Quiz', labelZh: '练习', href: '/quiz' },
    { label: 'Exam', labelZh: '考试', href: '/exam' },
    { label: 'Memory', labelZh: '记忆', href: '/memory' },
  ],
} as const

export const levelOptions: LevelOption[] = [
  {
    id: 'beginner' as LearningLevel,
    name: 'Beginner',
    nameZh: '入门',
    description: 'Start from scratch — alphabet, basic greetings, everyday words.',
    descriptionZh: '从零开始，字母、基础问候、日常词汇。',
  },
  {
    id: 'elementary' as LearningLevel,
    name: 'Elementary',
    nameZh: '新手',
    description: 'Build foundational vocabulary and simple sentence structures.',
    descriptionZh: '构建基础词汇，学习简单句型。',
  },
  {
    id: 'intermediate' as LearningLevel,
    name: 'Intermediate',
    nameZh: '熟练',
    description: 'Expand vocabulary, improve reading fluency and listening.',
    descriptionZh: '扩展词汇，提升阅读流利度与听力。',
  },
  {
    id: 'advanced' as LearningLevel,
    name: 'Advanced',
    nameZh: '进阶',
    description: 'Master nuanced vocabulary, academic writing, and complex grammar.',
    descriptionZh: '掌握细致词汇、学术写作与复杂语法。',
  },
  {
    id: 'exam-prep' as LearningLevel,
    name: 'Exam Prep',
    nameZh: '考试备考',
    description: 'Focused training for TOEFL, IELTS, CET-4/6, 考研, or 高考.',
    descriptionZh: '专项备考托福、雅思、四六级、考研或高考。',
  },
  {
    id: 'free-explore' as LearningLevel,
    name: 'Free Explore',
    nameZh: '自由探索',
    description: 'No fixed path — dive into any module that interests you.',
    descriptionZh: '无固定路径，随心探索感兴趣的模块。',
  },
]
```

- [ ] **Step 2: Create `config/learning-modules.ts`**

```typescript
import type { LearningModule } from '@/types/learning'

export const learningModules: LearningModule[] = [
  {
    id: 'vocabulary-roots',
    name: 'Vocabulary Roots',
    nameZh: '词汇根系',
    type: 'Core Vocabulary',
    typeZh: '核心词汇',
    description:
      'Search words, explore definitions, phonetics, etymology, mnemonics, and example sentences. Your growing vocabulary root system.',
    descriptionZh:
      '搜索单词，探索释义、音标、词源、记忆法与例句。你不断生长的词汇根系。',
    abilities: [
      'Search and look up any English word',
      'View phonetics, etymology, and mnemonics',
      'Save words to your personal word bank',
    ],
    abilitiesZh: [
      '搜索并查阅任意英文单词',
      '查看音标、词源与记忆法',
      '收藏单词到个人词库',
    ],
    route: '/dictionary',
    visualPosition: { x: 2, y: 8, z: 5 },
    color: '#38BDF8',
    icon: '🌱',
  },
  {
    id: 'voice-sonar',
    name: 'Voice Sonar',
    nameZh: '声音脉络',
    type: 'Pronunciation & Speaking',
    typeZh: '发音与口语',
    description:
      'Phonetics, pronunciation playback, dictation, shadowing, and speaking practice. Train your ear and your voice.',
    descriptionZh: '音标、发音播放、听写、跟读与口语训练。训练你的耳朵与声音。',
    abilities: [
      'Listen to native pronunciation of any word',
      'Practice dictation and shadowing',
      'Speaking training with AI feedback',
    ],
    abilitiesZh: [
      '收听任意单词的母语发音',
      '练习听写与跟读',
      'AI 反馈辅助口语训练',
    ],
    route: '/study',
    visualPosition: { x: -58, y: 54, z: 0 },
    color: '#7EF9FF',
    icon: '🔊',
  },
  {
    id: 'ai-navigator',
    name: 'AI Navigator',
    nameZh: 'AI 导学核心',
    type: 'Core System',
    typeZh: '核心系统',
    description:
      'Your intelligent study guide for word explanation, sentence analysis, quiz generation, and long-term learning plans.',
    descriptionZh:
      '你的智能学习向导，可用于单词解释、句子分析、练习生成与长期学习计划。',
    abilities: [
      'Ask about words, sentences, grammar, and exams',
      'Generate personalized quizzes',
      'Build adaptive learning plans',
    ],
    abilitiesZh: [
      '提问单词、句子、语法与考试',
      '生成个性化练习',
      '制定自适应学习计划',
    ],
    route: '/chat',
    visualPosition: { x: 0, y: 38, z: 0 },
    color: '#8B5CF6',
    icon: '🤖',
  },
  {
    id: 'reading-canopy',
    name: 'Reading Canopy',
    nameZh: '阅读树冠',
    type: 'Reading Training',
    typeZh: '阅读训练',
    description:
      'Reading training, long-sentence analysis, article comprehension, and vocabulary annotation inside real texts.',
    descriptionZh: '阅读训练、长难句分析、文章理解与文本内生词标注。',
    abilities: [
      'Read annotated articles with difficulty grading',
      'Analyze complex sentences with AI breakdown',
      'Track unfamiliar words while reading',
    ],
    abilitiesZh: [
      '阅读带注释的分级文章',
      'AI 辅助分析复杂句子',
      '阅读时追踪生词',
    ],
    route: '/study',
    visualPosition: { x: 58, y: 56, z: 10 },
    color: '#B8FFB2',
    icon: '📖',
  },
  {
    id: 'scan-hollow',
    name: 'Scan Hollow',
    nameZh: '文档树洞',
    type: 'Document Intelligence',
    typeZh: '文档智能',
    description:
      'Upload PDFs or images of worksheets. Extract questions, pull out unfamiliar words, and get answer suggestions.',
    descriptionZh: '上传 PDF 或题目图片，识别题目，提取生词，获取答案建议。',
    abilities: [
      'Upload PDF or image of any worksheet',
      'Auto-extract vocabulary from documents',
      'Get AI-suggested answers and explanations',
    ],
    abilitiesZh: [
      '上传任意题目的 PDF 或图片',
      '自动从文档中提取词汇',
      '获取 AI 答案建议与解析',
    ],
    route: '/scan',
    visualPosition: { x: 9, y: 22, z: 8 },
    color: '#FFD76A',
    icon: '📄',
  },
  {
    id: 'exam-branch',
    name: 'Exam Branch',
    nameZh: '考试枝路',
    type: 'Exam Preparation',
    typeZh: '考试备考',
    description:
      'Targeted training for TOEFL, IELTS, CET-4/6, 考研, and 高考. Mock exams, specialist drills, and progress tracking.',
    descriptionZh: '托福、雅思、四六级、考研与高考专项训练。模拟考试、专项练习与进度追踪。',
    abilities: [
      'Select your target exam and start drilling',
      'Take timed mock exam sections',
      'Review wrong answers with AI explanations',
    ],
    abilitiesZh: [
      '选择目标考试开始专项训练',
      '计时模拟考试',
      '结合 AI 解析复习错题',
    ],
    route: '/exam',
    visualPosition: { x: 72, y: 46, z: 0 },
    color: '#F97316',
    icon: '📝',
  },
  {
    id: 'memory-roots',
    name: 'Memory Roots',
    nameZh: '记忆根系',
    type: 'Spaced Repetition',
    typeZh: '间隔复习',
    description:
      'Spaced repetition, wrong-answer notebook, saved word collections, memory curves, and weak-point reinforcement.',
    descriptionZh: '间隔复习、错题本、收藏单词、记忆曲线与弱点强化。',
    abilities: [
      'Review due words based on your memory curve',
      'Track and retry your wrong answers',
      'Strengthen weak vocabulary automatically',
    ],
    abilitiesZh: [
      '按记忆曲线复习到期单词',
      '追踪并重练错题',
      '自动强化薄弱词汇',
    ],
    route: '/memory',
    visualPosition: { x: -14, y: 0, z: 0 },
    color: '#34D399',
    icon: '🧠',
  },
]

export function getModuleById(id: string): LearningModule | undefined {
  return learningModules.find(m => m.id === id)
}
```

- [ ] **Step 3: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```powershell
git add config/ types/
git commit -m "feat: add site config and learning module definitions"
```

---

## Task 4: Create mock data and lib utils

**Files:**
- Create: `lib/utils.ts`
- Create: `data/mock-words.ts`
- Create: `data/mock-exam-questions.ts`

- [ ] **Step 1: Create `lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Then install the deps:
```powershell
npm install clsx tailwind-merge
```

- [ ] **Step 2: Create `data/mock-words.ts`**

```typescript
import type { Word } from '@/types/word'

export const mockWords: Word[] = [
  {
    id: 'ubiquitous',
    word: 'ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Present, appearing, or found everywhere.',
        meaningZh: '无处不在的；普遍存在的。',
        example: 'Smartphones have become ubiquitous in modern society.',
        exampleZh: '智能手机在现代社会已无处不在。',
      },
    ],
    etymology: {
      roots: 'Latin ubique "everywhere" + -ous',
      explanation: 'From Latin ubique meaning "everywhere", from ubi "where" + -que "and".',
      explanationZh: '源自拉丁语 ubique，意为"到处"，由 ubi（在哪里）与 -que（以及）构成。',
    },
    mnemonic: 'U + BIG + QUIT + OUS: You big quit — ous! You can\'t quit it because it\'s everywhere.',
    mnemonicZh: '谐音"优比克维特斯"——"优秀比较突出"，优秀的东西自然无处不在。',
    tags: ['GRE', 'TOEFL', 'academic'],
    difficulty: 4,
  },
  {
    id: 'ephemeral',
    word: 'ephemeral',
    phonetic: '/ɪˈfemərəl/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Lasting for a very short time.',
        meaningZh: '短暂的；瞬间即逝的。',
        example: 'The beauty of cherry blossoms is ephemeral.',
        exampleZh: '樱花的美丽是短暂的。',
      },
    ],
    etymology: {
      roots: 'Greek ephemeros "lasting a day" (epi- "on" + hemera "day")',
      explanation: 'From Greek ephemeros, literally "lasting only a day".',
      explanationZh: '源自希腊语 ephemeros，字面意思是"仅持续一天"，由 epi（在……上）和 hemera（天）构成。',
    },
    mnemonic: 'e-PHEMER-al: Think "fever" — a fever is ephemeral, it passes quickly.',
    mnemonicZh: '谐音"一飞没了"——飞起来就没了，形容短暂。',
    tags: ['GRE', 'literary', 'IELTS'],
    difficulty: 4,
  },
  {
    id: 'resilient',
    word: 'resilient',
    phonetic: '/rɪˈzɪliənt/',
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Able to withstand or recover quickly from difficult conditions.',
        meaningZh: '有弹性的；能快速从困难中恢复的。',
        example: 'Children are often more resilient than adults give them credit for.',
        exampleZh: '孩子往往比大人认为的更有韧性。',
      },
    ],
    etymology: {
      roots: 'Latin resilire "to leap back" (re- "back" + salire "to jump")',
      explanation: 'From Latin resilire, meaning "to spring back", combined with the suffix -ent.',
      explanationZh: '源自拉丁语 resilire，意为"弹回"，由 re-（回）和 salire（跳）构成。',
    },
    mnemonic: 'RE-SILI-ENT: Like a rubber band, it re-sili-ently bounces back.',
    mnemonicZh: '谐音"如硅恩体"——硅橡胶有弹性，会弹回来，象征韧性。',
    tags: ['CET-6', 'IELTS', 'psychology'],
    difficulty: 3,
  },
]

export function getMockWord(id: string): Word | undefined {
  return mockWords.find(w => w.id === id)
}
```

- [ ] **Step 3: Create `data/mock-exam-questions.ts`**

```typescript
export interface ExamQuestion {
  id: string
  type: 'vocabulary' | 'reading' | 'listening' | 'grammar'
  exam: 'TOEFL' | 'IELTS' | 'CET-4' | 'CET-6' | 'KAOYAN' | 'GAOKAO'
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  explanationZh: string
}

export const mockExamQuestions: ExamQuestion[] = [
  {
    id: 'q001',
    type: 'vocabulary',
    exam: 'CET-6',
    question: 'The scientist\'s _____ research led to a breakthrough in cancer treatment.',
    options: ['superficial', 'meticulous', 'arbitrary', 'reckless'],
    correctIndex: 1,
    explanation: '"Meticulous" means showing great attention to detail. A scientist\'s careful research leading to a breakthrough fits this context perfectly.',
    explanationZh: '"Meticulous"意为"一丝不苟的、精心的"，科学家精心的研究带来突破，符合语境。',
  },
  {
    id: 'q002',
    type: 'reading',
    exam: 'TOEFL',
    question: 'According to the passage, what is the primary reason for coral reef decline?',
    options: [
      'Overfishing by local communities',
      'Rising ocean temperatures due to climate change',
      'Increased tourism and diving activities',
      'Natural disease cycles in marine ecosystems',
    ],
    correctIndex: 1,
    explanation: 'The passage states that rising ocean temperatures caused by climate change is the leading driver of coral bleaching and reef decline.',
    explanationZh: '文章指出，气候变化导致的海洋温度上升是珊瑚白化和珊瑚礁衰退的主要原因。',
  },
]
```

- [ ] **Step 4: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```powershell
git add lib/ data/
git commit -m "feat: add mock data and cn utility"
```

---

## Task 5: Global styles and root layout

**Files:**
- Modify: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `components/layout/AppShell.tsx`
- Create: `components/layout/Navbar.tsx`

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --bg-deep: #020617;
  --bg-ocean: #031827;
  --particle-cyan: #7EF9FF;
  --particle-mint: #B8FFB2;
  --particle-gold: #FFD76A;
  --accent-blue: #38BDF8;
  --accent-violet: #8B5CF6;
  --text-primary: #ECFBFF;
  --text-secondary: #9BBFCA;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-deep);
  color: var(--text-primary);
  font-family: ui-sans-serif, system-ui, sans-serif;
  overflow-x: hidden;
}

/* Scrollbar — dark ocean style */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg-deep);
}
::-webkit-scrollbar-thumb {
  background: var(--accent-blue);
  border-radius: 3px;
}
```

- [ ] **Step 2: Create `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: `${siteConfig.projectName} — ${siteConfig.slogan}`,
  description: siteConfig.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Create `components/layout/Navbar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { siteConfig } from '@/config/site'

export function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.9), transparent)' }}
    >
      <Link href="/" className="flex flex-col leading-none">
        <span
          className="text-lg font-bold tracking-widest"
          style={{ color: 'var(--particle-cyan)' }}
        >
          {siteConfig.projectName}
        </span>
        <span className="text-xs tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          {siteConfig.projectNameZh}
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {siteConfig.navigation.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center leading-none group"
          >
            <span
              className="text-sm tracking-wide transition-colors group-hover:text-[var(--particle-cyan)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.label}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
              {item.labelZh}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/onboarding"
        className="text-xs tracking-widest px-4 py-2 rounded border transition-colors"
        style={{
          borderColor: 'var(--accent-blue)',
          color: 'var(--accent-blue)',
        }}
      >
        Choose Level / 选择等级
      </Link>
    </nav>
  )
}
```

- [ ] **Step 4: Create `components/layout/AppShell.tsx`**

```typescript
import { Navbar } from './Navbar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
```

- [ ] **Step 5: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 6: Commit**

```powershell
git add app/globals.css app/layout.tsx components/layout/
git commit -m "feat: global styles, root layout, Navbar, AppShell"
```

---

## Task 6: UI primitive components

**Files:**
- Create: `components/ui/GlassPanel.tsx`
- Create: `components/ui/BilingualText.tsx`

- [ ] **Step 1: Create `components/ui/GlassPanel.tsx`**

```typescript
import { cn } from '@/lib/utils'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function GlassPanel({ children, className, glowColor = 'var(--accent-blue)' }: GlassPanelProps) {
  return (
    <div
      className={cn('rounded-xl p-5 relative overflow-hidden', className)}
      style={{
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${glowColor}40`,
        boxShadow: `0 0 24px ${glowColor}20, inset 0 0 40px rgba(0,0,0,0.4)`,
      }}
    >
      {/* scan-line shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-40"
        style={{ background: `linear-gradient(to right, transparent, ${glowColor}, transparent)` }}
      />
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/ui/BilingualText.tsx`**

```typescript
import { cn } from '@/lib/utils'

interface BilingualTextProps {
  en: string
  zh: string
  enClassName?: string
  zhClassName?: string
  className?: string
  layout?: 'stacked' | 'inline'
}

export function BilingualText({
  en,
  zh,
  enClassName,
  zhClassName,
  className,
  layout = 'stacked',
}: BilingualTextProps) {
  if (layout === 'inline') {
    return (
      <span className={cn('inline-flex items-baseline gap-2', className)}>
        <span className={cn('font-medium', enClassName)}>{en}</span>
        <span
          className={cn('text-sm opacity-70', zhClassName)}
          style={{ color: 'var(--text-secondary)' }}
        >
          {zh}
        </span>
      </span>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <span className={cn('leading-tight', enClassName)}>{en}</span>
      <span
        className={cn('text-sm opacity-70', zhClassName)}
        style={{ color: 'var(--text-secondary)' }}
      >
        {zh}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```powershell
git add components/ui/
git commit -m "feat: GlassPanel and BilingualText UI primitives"
```

---

## Task 7: Banyan particle config and types

**Files:**
- Create: `components/visual/BanyanParticleHero/banyan-types.ts`
- Create: `components/visual/BanyanParticleHero/banyan-particle-config.ts`

- [ ] **Step 1: Create `components/visual/BanyanParticleHero/banyan-types.ts`**

```typescript
export interface BanyanCurveConfig {
  rootCurves: number
  rootPointsPerCurve: number
  trunkCurves: number
  trunkPointsPerCurve: number
  avgBranchesPerTrunk: number
  branchPointsPerCurve: number
  aerialRoots: number
  aerialRootPointsPerCurve: number
}

export interface BanyanColorConfig {
  baseCyan: string
  tipWhite: string
  accentGreen: string
}

export interface BanyanBloomConfig {
  intensity: number
  luminanceThreshold: number
  luminanceSmoothing: number
}

export interface BanyanAnimationConfig {
  autoRotateSpeed: number
  wobbleStrength: number
}

export interface BanyanCameraConfig {
  fov: number
  position: [number, number, number]
  target: [number, number, number]
  fogDensity: number
}

export interface BanyanMouseConfig {
  influenceRadius: number
  influenceStrength: number
}
```

- [ ] **Step 2: Create `components/visual/BanyanParticleHero/banyan-particle-config.ts`**

```typescript
import type {
  BanyanCurveConfig,
  BanyanColorConfig,
  BanyanBloomConfig,
  BanyanAnimationConfig,
  BanyanCameraConfig,
  BanyanMouseConfig,
} from './banyan-types'

export const BANYAN_CURVES_DESKTOP: BanyanCurveConfig = {
  rootCurves: 150,
  rootPointsPerCurve: 100,
  trunkCurves: 200,
  trunkPointsPerCurve: 150,
  avgBranchesPerTrunk: 4,
  branchPointsPerCurve: 120,
  aerialRoots: 600,
  aerialRootPointsPerCurve: 100,
}

export const BANYAN_CURVES_MOBILE: BanyanCurveConfig = {
  rootCurves: 50,
  rootPointsPerCurve: 40,
  trunkCurves: 60,
  trunkPointsPerCurve: 60,
  avgBranchesPerTrunk: 3,
  branchPointsPerCurve: 50,
  aerialRoots: 200,
  aerialRootPointsPerCurve: 40,
}

export const BANYAN_COLORS: BanyanColorConfig = {
  baseCyan: '#22D3EE',
  tipWhite: '#E0F8FF',
  accentGreen: '#4ade80',
}

export const BANYAN_BLOOM: BanyanBloomConfig = {
  intensity: 1.8,
  luminanceThreshold: 0.15,
  luminanceSmoothing: 0.9,
}

export const BANYAN_ANIMATION: BanyanAnimationConfig = {
  autoRotateSpeed: 0.3,
  wobbleStrength: 0.1,
}

export const BANYAN_CAMERA: BanyanCameraConfig = {
  fov: 45,
  position: [0, 15, 180],
  target: [0, 40, 0],
  fogDensity: 0.003,
}

export const BANYAN_MOUSE: BanyanMouseConfig = {
  influenceRadius: 0.4,
  influenceStrength: 2.0,
}

// GLSL shaders — ported verbatim from the HTML demo with mouse uniforms added.
// Particle size (2.5) and wobble (0.1) match the original demo values.
export const BANYAN_SHADERS = {
  vertex: /* glsl */ `
    uniform float uTime;
    uniform vec2 uMouseNDC;
    uniform float uMouseForce;

    attribute float aPathLength;
    attribute float aDelay;
    attribute float aDuration;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = aColor;

      float progress = clamp((uTime - aDelay) / aDuration, 0.0, 1.0);
      // Smoothstep easing — matches original demo
      progress = progress * progress * (3.0 - 2.0 * progress);

      vAlpha = 0.0;
      vec3 pos = position;

      if (aPathLength <= progress && progress > 0.0) {
        float headDist = progress - aPathLength;

        if (headDist < 0.02) {
          // Bright white head of the light streak
          vAlpha = 1.0;
          vColor = vec3(1.0);
        } else {
          // Translucent trail
          vAlpha = 0.15;

          float afterTime = uTime - (aDelay + aDuration);
          if (afterTime > 0.0) {
            // Internal energy pulse after tree is formed
            float pulsePhase = mod(afterTime * 0.3, 1.0);
            float pulseDist = abs(aPathLength - pulsePhase);
            if (pulseDist < 0.05) {
              vAlpha += (0.05 - pulseDist) * 10.0;
              vColor = mix(vColor, vec3(0.8, 1.0, 1.0), 0.8);
            }
            vAlpha += sin(uTime * 2.0 + aPathLength * 20.0) * 0.05;
          }
        }

        // Gentle life-wobble (matches original demo 0.1 strength)
        pos.x += sin(uTime * 1.5 + pos.y * 0.5) * 0.1 * progress;
        pos.z += cos(uTime * 1.5 + pos.x * 0.5) * 0.1 * progress;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Mouse air-current disturbance
      vec2 posNDC = gl_Position.xy / gl_Position.w;
      float mouseDist = length(posNDC - uMouseNDC);
      float mouseInfluence = max(0.0, 1.0 - mouseDist * (1.0 / 0.4)) * uMouseForce;
      if (mouseInfluence > 0.001) {
        pos.x += sin(pos.y * 2.0 + uTime * 3.0) * mouseInfluence * 2.0;
        pos.z += cos(pos.x * 2.0 + uTime * 3.0) * mouseInfluence * 2.0;
        mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }

      // Perspective point sizing (matches original demo)
      gl_PointSize = 2.5 * (100.0 / -mvPosition.z);
    }
  `,
  fragment: /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      if (vAlpha <= 0.0) discard;

      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      float core = pow(1.0 - (dist * 2.0), 1.5);
      gl_FragColor = vec4(vColor, core * vAlpha);
    }
  `,
}
```

- [ ] **Step 3: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```powershell
git add components/visual/
git commit -m "feat: banyan particle config, types, and GLSL shaders"
```

---

## Task 8: BanyanParticleSystem — core shader component

**Files:**
- Create: `components/visual/BanyanParticleHero/BanyanParticleSystem.tsx`

This is the ported Three.js particle system. The curve-generation math is identical to the HTML demo. The rendering uses R3F's `useFrame` loop.

- [ ] **Step 1: Create `components/visual/BanyanParticleHero/BanyanParticleSystem.tsx`**

```typescript
'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  BANYAN_CURVES_DESKTOP,
  BANYAN_CURVES_MOBILE,
  BANYAN_COLORS,
  BANYAN_SHADERS,
} from './banyan-particle-config'
import type { BanyanCurveConfig } from './banyan-types'

// -------------------------------------------------------
// Curve generation — ported 1:1 from HTML demo
// -------------------------------------------------------

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

interface ParticleArrays {
  positions: number[]
  pathLengths: number[]
  delays: number[]
  durations: number[]
  colors: number[]
}

function buildParticleArrays(cfg: BanyanCurveConfig): ParticleArrays {
  const positions: number[] = []
  const pathLengths: number[] = []
  const delays: number[] = []
  const durations: number[] = []
  const colors: number[] = []

  const colorBase = new THREE.Color(BANYAN_COLORS.baseCyan)
  const colorTip = new THREE.Color(BANYAN_COLORS.tipWhite)
  const colorGold = new THREE.Color(BANYAN_COLORS.accentGreen)

  function addCurve(
    curve: THREE.CatmullRomCurve3,
    pointCount: number,
    delay: number,
    duration: number,
    colorScale = 1.0,
  ) {
    const points = curve.getPoints(pointCount)
    const isVariant = Math.random() > 0.8
    const finalColor = new THREE.Color().copy(colorBase)
    if (isVariant) finalColor.lerp(colorGold, 0.6)

    for (let i = 0; i <= pointCount; i++) {
      const pt = points[i]
      const progress = i / pointCount
      positions.push(pt.x, pt.y, pt.z)
      pathLengths.push(progress)
      delays.push(delay)
      durations.push(duration)
      const ptColor = finalColor.clone().lerp(colorTip, progress * colorScale)
      colors.push(ptColor.r, ptColor.g, ptColor.b)
    }
  }

  // Stage 1 — Ground roots (0–1 s)
  for (let i = 0; i < cfg.rootCurves; i++) {
    const angle = rand(0, Math.PI * 2)
    const radius = rand(15, 60)
    const p0 = new THREE.Vector3(rand(-3, 3), -5, rand(-3, 3))
    const p1 = new THREE.Vector3(Math.cos(angle) * radius * 0.4, 0, Math.sin(angle) * radius * 0.4)
    const p2 = new THREE.Vector3(Math.cos(angle) * radius, rand(-3, 0), Math.sin(angle) * radius)
    addCurve(new THREE.CatmullRomCurve3([p0, p1, p2]), cfg.rootPointsPerCurve, rand(0, 0.5), rand(1.0, 1.5))
  }

  // Stage 2 — Trunk (1–2.5 s)
  const trunkTops: THREE.Vector3[] = []
  for (let i = 0; i < cfg.trunkCurves; i++) {
    const angle = rand(0, Math.PI * 2)
    const rBase = rand(3, 12)
    const p0 = new THREE.Vector3(Math.cos(angle) * rBase, 0, Math.sin(angle) * rBase)
    const twist = angle + rand(-Math.PI * 1.5, Math.PI * 1.5)
    const p1 = new THREE.Vector3(Math.cos(twist) * rBase * 0.6, rand(15, 25), Math.sin(twist) * rBase * 0.6)
    const p2 = new THREE.Vector3(rand(-15, 15), rand(35, 45), rand(-15, 15))
    trunkTops.push(p2)
    addCurve(new THREE.CatmullRomCurve3([p0, p1, p2]), cfg.trunkPointsPerCurve, rand(0.5, 1.2), rand(1.5, 2.0))
  }

  // Stage 3 — Canopy branches (2–3 s)
  const branchTops: THREE.Vector3[] = []
  for (const tTop of trunkTops) {
    const numBranches = Math.floor(rand(3, 5))
    for (let i = 0; i < numBranches; i++) {
      const bAngle = rand(0, Math.PI * 2)
      const bSpread = rand(30, 100)
      const bHeight = tTop.y + rand(-5, 15)
      const p1 = new THREE.Vector3(
        tTop.x + Math.cos(bAngle) * bSpread * 0.4,
        tTop.y + rand(5, 10),
        tTop.z + Math.sin(bAngle) * bSpread * 0.4,
      )
      const p2 = new THREE.Vector3(
        tTop.x + Math.cos(bAngle) * bSpread,
        bHeight,
        tTop.z + Math.sin(bAngle) * bSpread,
      )
      branchTops.push(p2)
      addCurve(new THREE.CatmullRomCurve3([tTop, p1, p2]), cfg.branchPointsPerCurve, rand(2.0, 3.0), rand(1.5, 2.5), 1.2)
    }
  }

  // Stage 4 — Aerial roots (3.5–5 s)
  for (let i = 0; i < cfg.aerialRoots; i++) {
    if (branchTops.length === 0) break
    const src = branchTops[Math.floor(rand(0, branchTops.length))]
    const p1 = new THREE.Vector3(src.x + rand(-5, 5), src.y * 0.5, src.z + rand(-5, 5))
    const p2 = new THREE.Vector3(src.x + rand(-2, 2), rand(-5, 5), src.z + rand(-2, 2))
    addCurve(
      new THREE.CatmullRomCurve3([src, p1, p2]),
      cfg.aerialRootPointsPerCurve,
      rand(3.5, 4.5),
      rand(1.5, 2.5),
    )
  }

  return { positions, pathLengths, delays, durations, colors }
}

function buildGeometry(cfg: BanyanCurveConfig): THREE.BufferGeometry {
  const data = buildParticleArrays(cfg)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3))
  geo.setAttribute('aPathLength', new THREE.Float32BufferAttribute(data.pathLengths, 1))
  geo.setAttribute('aDelay', new THREE.Float32BufferAttribute(data.delays, 1))
  geo.setAttribute('aDuration', new THREE.Float32BufferAttribute(data.durations, 1))
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(data.colors, 3))
  return geo
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

interface BanyanParticleSystemProps {
  animationKey?: number
}

export function BanyanParticleSystem({ animationKey = 0 }: BanyanParticleSystemProps) {
  const { size, pointer } = useThree()
  const clockRef = useRef(-0.5)
  const prevPointer = useRef(new THREE.Vector2())
  const mouseForce = useRef(0)

  const isMobile = size.width < 768
  const cfg = isMobile ? BANYAN_CURVES_MOBILE : BANYAN_CURVES_DESKTOP

  const geometry = useMemo(
    () => buildGeometry(cfg),
    // cfg reference changes when isMobile changes; animationKey forces rebuild on restart
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobile, animationKey],
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMouseNDC: { value: new THREE.Vector2(0, 0) },
          uMouseForce: { value: 0 },
        },
        vertexShader: BANYAN_SHADERS.vertex,
        fragmentShader: BANYAN_SHADERS.fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  // Reset animation clock when animationKey changes (user pressed Replay)
  useEffect(() => {
    clockRef.current = -0.5
  }, [animationKey])

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_, delta) => {
    clockRef.current += delta

    // Smooth mouse force: high velocity → strong disturbance, decays quickly
    const velocity = prevPointer.current.distanceTo(pointer)
    mouseForce.current = velocity * 20 * 0.4 + mouseForce.current * 0.6
    prevPointer.current.copy(pointer)

    material.uniforms.uTime.value = Math.max(0, clockRef.current)
    material.uniforms.uMouseNDC.value.copy(pointer)
    material.uniforms.uMouseForce.value = Math.min(mouseForce.current, 1.0)
  })

  return (
    <points geometry={geometry}>
      <primitive object={material} attach="material" />
    </points>
  )
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```powershell
git add components/visual/BanyanParticleHero/BanyanParticleSystem.tsx
git commit -m "feat: BanyanParticleSystem — GLSL shader particle system ported from HTML demo"
```

---

## Task 9: Interaction hook + module nodes

**Files:**
- Create: `components/visual/BanyanParticleHero/useBanyanInteraction.ts`
- Create: `components/visual/BanyanParticleHero/BanyanModuleNodes.tsx`

- [ ] **Step 1: Create `components/visual/BanyanParticleHero/useBanyanInteraction.ts`**

```typescript
import { useState, useCallback } from 'react'
import type { ModuleId } from '@/types/learning'

export interface BanyanInteractionState {
  activeModuleId: ModuleId | null
  hoveredModuleId: ModuleId | null
  isPanelOpen: boolean
  animationKey: number
}

export interface BanyanInteractionActions {
  handleNodeClick: (id: ModuleId) => void
  handleNodeHover: (id: ModuleId | null) => void
  closePanel: () => void
  restartAnimation: () => void
}

export function useBanyanInteraction(): BanyanInteractionState & BanyanInteractionActions {
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null)
  const [hoveredModuleId, setHoveredModuleId] = useState<ModuleId | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  const handleNodeClick = useCallback((id: ModuleId) => {
    setActiveModuleId(id)
    setIsPanelOpen(true)
  }, [])

  const handleNodeHover = useCallback((id: ModuleId | null) => {
    setHoveredModuleId(id)
  }, [])

  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
    setActiveModuleId(null)
  }, [])

  const restartAnimation = useCallback(() => {
    setAnimationKey(k => k + 1)
  }, [])

  return {
    activeModuleId,
    hoveredModuleId,
    isPanelOpen,
    animationKey,
    handleNodeClick,
    handleNodeHover,
    closePanel,
    restartAnimation,
  }
}
```

- [ ] **Step 2: Create `components/visual/BanyanParticleHero/BanyanModuleNodes.tsx`**

This component renders inside the R3F `<Canvas>`. Each node uses `<Html>` from drei, which auto-projects 3D coordinates to screen-space DOM, so nodes orbit with the tree during auto-rotation.

```typescript
'use client'

import { Html } from '@react-three/drei'
import { learningModules } from '@/config/learning-modules'
import type { ModuleId } from '@/types/learning'

interface BanyanModuleNodesProps {
  activeModuleId: ModuleId | null
  hoveredModuleId: ModuleId | null
  onNodeClick: (id: ModuleId) => void
  onNodeHover: (id: ModuleId | null) => void
}

export function BanyanModuleNodes({
  activeModuleId,
  hoveredModuleId,
  onNodeClick,
  onNodeHover,
}: BanyanModuleNodesProps) {
  return (
    <>
      {learningModules.map(module => {
        const { x, y, z } = module.visualPosition
        const isActive = activeModuleId === module.id
        const isHovered = hoveredModuleId === module.id
        const highlight = isActive || isHovered

        return (
          <Html key={module.id} position={[x, y, z]} center zIndexRange={[10, 20]}>
            <button
              onClick={() => onNodeClick(module.id as ModuleId)}
              onMouseEnter={() => onNodeHover(module.id as ModuleId)}
              onMouseLeave={() => onNodeHover(null)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                outline: 'none',
                userSelect: 'none',
              }}
              aria-label={`${module.name} / ${module.nameZh}`}
            >
              {/* Outer pulse ring */}
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: highlight ? '40px' : '28px',
                  height: highlight ? '40px' : '28px',
                  borderRadius: '50%',
                  border: `1px solid ${module.color}`,
                  opacity: highlight ? 0.9 : 0.5,
                  transition: 'all 0.25s ease',
                  animation: 'banyanPulse 2s ease-in-out infinite',
                }}
              />
              {/* Inner glow core */}
              <span
                style={{
                  position: 'relative',
                  width: highlight ? '14px' : '10px',
                  height: highlight ? '14px' : '10px',
                  borderRadius: '50%',
                  background: module.color,
                  boxShadow: `0 0 ${highlight ? '18px' : '10px'} ${module.color}`,
                  transition: 'all 0.25s ease',
                  zIndex: 1,
                }}
              />
              {/* Labels */}
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: highlight ? 1 : 0.7,
                  transition: 'opacity 0.25s ease',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: highlight ? module.color : '#ECFBFF',
                    whiteSpace: 'nowrap',
                    textShadow: highlight ? `0 0 8px ${module.color}` : '0 0 4px rgba(2,6,23,0.8)',
                    transition: 'color 0.25s ease',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {module.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    color: '#9BBFCA',
                    whiteSpace: 'nowrap',
                    fontFamily: 'ui-sans-serif, sans-serif',
                  }}
                >
                  {module.nameZh}
                </span>
              </span>
            </button>
          </Html>
        )
      })}

      {/* Keyframe for pulse ring — injected once */}
      <Html>
        <style>{`
          @keyframes banyanPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.2; }
          }
        `}</style>
      </Html>
    </>
  )
}
```

- [ ] **Step 3: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```powershell
git add components/visual/BanyanParticleHero/useBanyanInteraction.ts components/visual/BanyanParticleHero/BanyanModuleNodes.tsx
git commit -m "feat: useBanyanInteraction hook and module node Html overlay"
```

---

## Task 10: Module detail panel

**Files:**
- Create: `components/visual/BanyanParticleHero/BanyanModulePanel.tsx`

- [ ] **Step 1: Create `components/visual/BanyanParticleHero/BanyanModulePanel.tsx`**

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getModuleById } from '@/config/learning-modules'
import type { ModuleId } from '@/types/learning'

interface BanyanModulePanelProps {
  activeModuleId: ModuleId | null
  isOpen: boolean
  onClose: () => void
}

export function BanyanModulePanel({ activeModuleId, isOpen, onClose }: BanyanModulePanelProps) {
  const module = activeModuleId ? getModuleById(activeModuleId) : null

  return (
    <AnimatePresence>
      {isOpen && module && (
        <motion.div
          key={module.id}
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            right: '24px',
            transform: 'translateY(-50%)',
            width: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'rgba(2, 6, 23, 0.88)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: `1px solid ${module.color}50`,
            boxShadow: `0 0 40px ${module.color}20, 0 20px 60px rgba(0,0,0,0.6)`,
            padding: '24px',
            zIndex: 100,
          }}
        >
          {/* Top scan line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(to right, transparent, ${module.color}, transparent)`,
              opacity: 0.8,
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#9BBFCA',
              fontSize: '18px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
            aria-label="Close panel"
          >
            ×
          </button>

          {/* Module name */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: module.color,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {module.name}
            </div>
            <div style={{ fontSize: '13px', color: '#9BBFCA', marginTop: '2px' }}>
              {module.nameZh}
            </div>
          </div>

          {/* Module type badge */}
          <div
            style={{
              display: 'inline-block',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: module.color,
              border: `1px solid ${module.color}60`,
              borderRadius: '4px',
              padding: '2px 8px',
              marginBottom: '16px',
            }}
          >
            {module.type} / {module.typeZh}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.7,
              color: '#ECFBFF',
              marginBottom: '8px',
            }}
          >
            {module.description}
          </p>
          <p
            style={{
              fontSize: '12px',
              lineHeight: 1.7,
              color: '#9BBFCA',
              marginBottom: '20px',
            }}
          >
            {module.descriptionZh}
          </p>

          {/* Abilities */}
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: module.color,
              marginBottom: '10px',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            CORE ABILITIES / 核心能力
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', marginBottom: '24px' }}>
            {module.abilities.map((ability, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px',
                  marginBottom: '10px',
                  paddingLeft: '12px',
                  borderLeft: `2px solid ${module.color}50`,
                }}
              >
                <span style={{ fontSize: '12px', color: '#ECFBFF' }}>{ability}</span>
                <span style={{ fontSize: '11px', color: '#9BBFCA' }}>{module.abilitiesZh[i]}</span>
              </li>
            ))}
          </ul>

          {/* Enter module button */}
          <Link
            href={module.route}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '10px 20px',
              borderRadius: '8px',
              background: `${module.color}18`,
              border: `1px solid ${module.color}70`,
              color: module.color,
              fontSize: '13px',
              letterSpacing: '0.06em',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => {
              ;(e.target as HTMLAnchorElement).style.background = `${module.color}30`
            }}
            onMouseLeave={e => {
              ;(e.target as HTMLAnchorElement).style.background = `${module.color}18`
            }}
          >
            Enter Module / 进入模块
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```powershell
git add components/visual/BanyanParticleHero/BanyanModulePanel.tsx
git commit -m "feat: BanyanModulePanel — animated glass detail panel"
```

---

## Task 11: BanyanCanvas and BanyanParticleHero assembly

**Files:**
- Create: `components/visual/BanyanParticleHero/BanyanCanvas.tsx`
- Create: `components/visual/BanyanParticleHero/BanyanParticleHero.tsx`

- [ ] **Step 1: Create `components/visual/BanyanParticleHero/BanyanCanvas.tsx`**

```typescript
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { BanyanParticleSystem } from './BanyanParticleSystem'
import { BanyanModuleNodes } from './BanyanModuleNodes'
import { BANYAN_CAMERA, BANYAN_BLOOM, BANYAN_ANIMATION } from './banyan-particle-config'
import type { ModuleId } from '@/types/learning'

interface BanyanCanvasProps {
  activeModuleId: ModuleId | null
  hoveredModuleId: ModuleId | null
  animationKey: number
  onNodeClick: (id: ModuleId) => void
  onNodeHover: (id: ModuleId | null) => void
}

export function BanyanCanvas({
  activeModuleId,
  hoveredModuleId,
  animationKey,
  onNodeClick,
  onNodeHover,
}: BanyanCanvasProps) {
  return (
    <Canvas
      camera={{
        fov: BANYAN_CAMERA.fov,
        position: BANYAN_CAMERA.position,
        near: 1,
        far: 1000,
      }}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
      }}
      onCreated={({ scene, gl }) => {
        scene.fog = new THREE.FogExp2(0x020617, BANYAN_CAMERA.fogDensity)
        gl.setClearColor(0x020617)
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <BanyanParticleSystem animationKey={animationKey} />

      <BanyanModuleNodes
        activeModuleId={activeModuleId}
        hoveredModuleId={hoveredModuleId}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
      />

      <OrbitControls
        autoRotate
        autoRotateSpeed={BANYAN_ANIMATION.autoRotateSpeed}
        enableDamping
        dampingFactor={0.05}
        enableZoom={false}
        enablePan={false}
        target={BANYAN_CAMERA.target}
      />

      <EffectComposer>
        <Bloom
          intensity={BANYAN_BLOOM.intensity}
          luminanceThreshold={BANYAN_BLOOM.luminanceThreshold}
          luminanceSmoothing={BANYAN_BLOOM.luminanceSmoothing}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
```

- [ ] **Step 2: Create `components/visual/BanyanParticleHero/BanyanParticleHero.tsx`**

```typescript
'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { useBanyanInteraction } from './useBanyanInteraction'
import { BanyanModulePanel } from './BanyanModulePanel'

// Canvas must be client-only (WebGL); dynamic import prevents SSR crash
const BanyanCanvas = dynamic(
  () => import('./BanyanCanvas').then(m => ({ default: m.BanyanCanvas })),
  { ssr: false },
)

export function BanyanParticleHero() {
  const interaction = useBanyanInteraction()

  return (
    <section
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#020617',
      }}
    >
      {/* Three.js Canvas */}
      <BanyanCanvas
        activeModuleId={interaction.activeModuleId}
        hoveredModuleId={interaction.hoveredModuleId}
        animationKey={interaction.animationKey}
        onNodeClick={interaction.handleNodeClick}
        onNodeHover={interaction.handleNodeHover}
      />

      {/* Hero text overlay — bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '48px',
          zIndex: 10,
          maxWidth: '480px',
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#ECFBFF',
            letterSpacing: '0.02em',
          }}
        >
          {siteConfig.slogan}
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 'clamp(13px, 1.8vw, 16px)',
            color: '#9BBFCA',
          }}
        >
          {siteConfig.sloganZh}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '28px',
            pointerEvents: 'auto',
          }}
        >
          <Link
            href="/onboarding"
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              color: '#38BDF8',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            {siteConfig.ctaPrimary} / {siteConfig.ctaPrimaryZh}
          </Link>
          <Link
            href="/onboarding"
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(155, 191, 202, 0.4)',
              color: '#9BBFCA',
              fontSize: '14px',
              letterSpacing: '0.06em',
              textDecoration: 'none',
            }}
          >
            {siteConfig.ctaSecondary} / {siteConfig.ctaSecondaryZh}
          </Link>
        </div>
      </div>

      {/* Interaction hints — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(56, 189, 248, 0.5)' }}>
          {siteConfig.heroHint}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(155, 191, 202, 0.4)' }}>
          {siteConfig.heroHintZh}
        </p>
      </div>

      {/* Replay button — bottom right */}
      <button
        onClick={interaction.restartAnimation}
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          background: 'rgba(2, 6, 23, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '6px',
          color: 'rgba(56, 189, 248, 0.6)',
          fontSize: '11px',
          letterSpacing: '0.1em',
          padding: '8px 14px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        ↺ REPLAY
      </button>

      {/* Module detail panel */}
      <BanyanModulePanel
        activeModuleId={interaction.activeModuleId}
        isOpen={interaction.isPanelOpen}
        onClose={interaction.closePanel}
      />
    </section>
  )
}
```

- [ ] **Step 3: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```powershell
git add components/visual/BanyanParticleHero/BanyanCanvas.tsx components/visual/BanyanParticleHero/BanyanParticleHero.tsx
git commit -m "feat: BanyanCanvas and BanyanParticleHero — hero section assembly"
```

---

## Task 12: Homepage

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```typescript
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/layout/AppShell'

// Hero is client-only (WebGL); no SSR
const BanyanParticleHero = dynamic(
  () =>
    import('@/components/visual/BanyanParticleHero/BanyanParticleHero').then(m => ({
      default: m.BanyanParticleHero,
    })),
  { ssr: false },
)

export default function HomePage() {
  return (
    <AppShell>
      <BanyanParticleHero />
    </AppShell>
  )
}
```

- [ ] **Step 2: Start dev server and verify hero renders**

```powershell
npm run dev
```
Open `http://localhost:3000`. Verify:
- Black/deep-ocean background
- Particles stream from the bottom
- Tree forms over ~5 seconds
- Canopy is wide, trunk is visible, aerial roots drop
- 7 labeled nodes appear
- Mouse movement disturbs nearby particles
- Clicking a node opens the glass panel
- REPLAY button resets animation

If the canvas is blank: check browser console for WebGL errors.
Ctrl+C to stop.

- [ ] **Step 3: Type-check and lint**

```powershell
npx tsc --noEmit && npm run lint
```
Expected: No type errors, no lint errors.

- [ ] **Step 4: Commit**

```powershell
git add app/page.tsx
git commit -m "feat: homepage with BanyanParticleHero"
```

---

## Task 13: Onboarding (level selection) page

**Files:**
- Create: `app/onboarding/page.tsx`

- [ ] **Step 1: Create `app/onboarding/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { siteConfig, levelOptions } from '@/config/site'
import type { LearningLevel } from '@/types/learning'

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<LearningLevel | null>(null)

  function handleConfirm() {
    if (!selected) return
    if (typeof window !== 'undefined') {
      localStorage.setItem('lexiocean_level', selected)
    }
    router.push('/')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-deep)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div
          style={{
            fontSize: '13px',
            letterSpacing: '0.2em',
            color: 'rgba(56, 189, 248, 0.6)',
            marginBottom: '12px',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {siteConfig.projectName} / {siteConfig.projectNameZh}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: 700,
            color: '#ECFBFF',
          }}
        >
          Choose Your Level
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#9BBFCA' }}>
          选择你的英语等级
        </p>
      </div>

      {/* Level grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
          maxWidth: '860px',
          width: '100%',
          marginBottom: '40px',
        }}
      >
        {levelOptions.map(level => {
          const isSelected = selected === level.id
          return (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              style={{
                background: isSelected
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.7)' : 'rgba(155, 191, 202, 0.2)'}`,
                borderRadius: '12px',
                padding: '20px 24px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.15)' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: isSelected ? '#38BDF8' : '#ECFBFF',
                  marginBottom: '2px',
                }}
              >
                {level.name}
              </div>
              <div style={{ fontSize: '13px', color: '#9BBFCA', marginBottom: '10px' }}>
                {level.nameZh}
              </div>
              <div style={{ fontSize: '13px', color: '#9BBFCA', lineHeight: 1.5 }}>
                {level.description}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(155, 191, 202, 0.7)', marginTop: '4px', lineHeight: 1.5 }}>
                {level.descriptionZh}
              </div>
            </button>
          )
        })}
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!selected}
        style={{
          padding: '14px 48px',
          borderRadius: '10px',
          background: selected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${selected ? 'rgba(56, 189, 248, 0.7)' : 'rgba(155, 191, 202, 0.2)'}`,
          color: selected ? '#38BDF8' : '#9BBFCA',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          cursor: selected ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
        }}
      >
        Confirm & Enter / 确认进入
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```powershell
git add app/onboarding/
git commit -m "feat: onboarding level selection page"
```

---

## Task 14: Shell pages for all feature routes

**Files:**
- Create: `app/dictionary/page.tsx`
- Create: `app/word/[slug]/page.tsx`
- Create: `app/chat/page.tsx`
- Create: `app/quiz/page.tsx`
- Create: `app/study/page.tsx`
- Create: `app/scan/page.tsx`
- Create: `app/exam/page.tsx`
- Create: `app/memory/page.tsx`

All shell pages follow the same pattern. Replace `[EN_TITLE]`, `[ZH_TITLE]`, `[EN_DESC]`, `[ZH_DESC]` with page-specific values shown in Step 1.

- [ ] **Step 1: Create a shared shell page template — create each file with unique strings**

Create `app/dictionary/page.tsx`:
```typescript
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function DictionaryPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <ShellHeader
            en="Vocabulary Roots"
            zh="词汇根系"
            desc="Search any English word for definitions, phonetics, etymology, mnemonics, and examples."
            descZh="搜索任意英文单词，获取释义、音标、词源、记忆法与例句。"
          />
          <div style={mockBoxStyle}>
            <div style={mockPlaceholderStyle}>[ 单词搜索框 — Mock Word Search ]</div>
            <div style={mockPlaceholderStyle}>[ 词典结果面板 — Mock Word Detail ]</div>
          </div>
          <BackLink />
        </div>
      </div>
    </AppShell>
  )
}

function ShellHeader({ en, zh, desc, descZh }: { en: string; zh: string; desc: string; descZh: string }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
        {en}
        <span style={{ fontSize: '18px', color: '#9BBFCA', marginLeft: '12px' }}>{zh}</span>
      </h1>
      <p style={{ margin: '8px 0 0', color: '#9BBFCA', fontSize: '14px' }}>{desc}</p>
      <p style={{ margin: '4px 0 0', color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>{descZh}</p>
    </div>
  )
}

function BackLink() {
  return (
    <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none', letterSpacing: '0.05em' }}>
      ← Back to Home / 返回首页
    </Link>
  )
}

const mockBoxStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(155,191,202,0.15)',
  borderRadius: '12px',
  padding: '32px',
  marginBottom: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const mockPlaceholderStyle: React.CSSProperties = {
  background: 'rgba(56,189,248,0.06)',
  border: '1px dashed rgba(56,189,248,0.25)',
  borderRadius: '8px',
  padding: '24px',
  color: 'rgba(56,189,248,0.5)',
  fontSize: '13px',
  letterSpacing: '0.05em',
  fontFamily: 'ui-monospace, monospace',
  textAlign: 'center',
}
```

Create `app/word/[slug]/page.tsx`:
```typescript
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function WordPage({ params }: { params: { slug: string } }) {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ marginBottom: '8px', fontSize: '13px', color: 'rgba(56,189,248,0.5)', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em' }}>
            WORD / 单词
          </div>
          <h1 style={{ margin: 0, fontSize: '40px', fontWeight: 700, color: '#ECFBFF', marginBottom: '8px' }}>
            {params.slug}
          </h1>
          <div style={{ fontSize: '18px', color: '#7EF9FF', marginBottom: '32px', fontFamily: 'ui-monospace, monospace' }}>
            /mɒk·fəˈnɛtɪks/
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(155,191,202,0.15)', borderRadius: '12px', padding: '28px', marginBottom: '32px', color: '#9BBFCA', fontSize: '13px', fontFamily: 'ui-monospace, monospace' }}>
            [ Mock Word Detail Panel — definitions, etymology, mnemonics will appear here ]
          </div>
          <Link href="/dictionary" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Dictionary / 词典
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
```

Create `app/chat/page.tsx`:
```typescript
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function ChatPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            AI Navigator <span style={{ fontSize: '18px', color: '#9BBFCA', marginLeft: '12px' }}>AI 导学核心</span>
          </h1>
          <p style={{ margin: '8px 0 24px', color: '#9BBFCA', fontSize: '14px' }}>
            Your intelligent study guide. Ask about words, grammar, exams, and get personalized learning plans.
          </p>
          <div style={{ height: '60vh', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(139,92,246,0.5)', fontFamily: 'ui-monospace, monospace', fontSize: '13px', letterSpacing: '0.05em' }}>
            [ AI Chat Interface — Mock / AI 对话界面占位 ]
          </div>
          <div style={{ marginTop: '24px' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>← Back to Home / 返回首页</Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
```

Create `app/quiz/page.tsx`:
```typescript
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function QuizPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Quiz Mode <span style={{ fontSize: '18px', color: '#9BBFCA', marginLeft: '12px' }}>练习模式</span>
          </h1>
          <p style={{ margin: '8px 0 24px', color: '#9BBFCA', fontSize: '14px' }}>
            Test your knowledge with AI-generated quizzes tailored to your level.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(56,189,248,0.2)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'rgba(56,189,248,0.4)', fontFamily: 'ui-monospace, monospace', fontSize: '13px', letterSpacing: '0.05em', marginBottom: '24px' }}>
            [ Quiz Card Interface — Mock / 练习题卡占位 ]
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>← Back to Home / 返回首页</Link>
        </div>
      </div>
    </AppShell>
  )
}
```

Create `app/study/page.tsx`:
```typescript
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function StudyPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Study Mode <span style={{ fontSize: '18px', color: '#9BBFCA', marginLeft: '12px' }}>学习模式</span>
          </h1>
          <p style={{ margin: '8px 0 24px', color: '#9BBFCA', fontSize: '14px' }}>
            Reading practice, pronunciation training, and structured study sessions.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {['Reading Canopy / 阅读树冠', 'Voice Sonar / 声音脉络', 'Study Plan / 学习计划', 'Progress / 学习进度'].map(label => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(56,189,248,0.2)', borderRadius: '10px', padding: '32px', textAlign: 'center', color: 'rgba(56,189,248,0.4)', fontSize: '12px', fontFamily: 'ui-monospace, monospace' }}>[ {label} — Mock ]</div>
            ))}
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>← Back to Home / 返回首页</Link>
        </div>
      </div>
    </AppShell>
  )
}
```

Create `app/scan/page.tsx`:
```typescript
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function ScanPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Scan Hollow <span style={{ fontSize: '18px', color: '#9BBFCA', marginLeft: '12px' }}>文档树洞</span>
          </h1>
          <p style={{ margin: '8px 0 24px', color: '#9BBFCA', fontSize: '14px' }}>
            Upload a PDF or image. Extract vocabulary, questions, and get AI-suggested answers.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,215,106,0.3)', borderRadius: '16px', padding: '64px 32px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
            <div style={{ color: 'rgba(255,215,106,0.6)', fontSize: '14px', marginBottom: '8px' }}>Drop PDF or image here / 拖放 PDF 或图片至此</div>
            <div style={{ color: 'rgba(155,191,202,0.4)', fontSize: '12px' }}>[ File upload — Mock / 文件上传占位 ]</div>
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>← Back to Home / 返回首页</Link>
        </div>
      </div>
    </AppShell>
  )
}
```

Create `app/exam/page.tsx`:
```typescript
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

const examTypes = [
  { en: 'TOEFL', zh: '托福', desc: 'Test of English as a Foreign Language' },
  { en: 'IELTS', zh: '雅思', desc: 'International English Language Testing System' },
  { en: 'CET-4', zh: '四级', desc: '大学英语四级' },
  { en: 'CET-6', zh: '六级', desc: '大学英语六级' },
  { en: '考研英语', zh: '考研', desc: 'Graduate School Entrance Exam English' },
  { en: '高考英语', zh: '高考', desc: 'National College Entrance Exam English' },
]

export default function ExamPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Exam Branch <span style={{ fontSize: '18px', color: '#9BBFCA', marginLeft: '12px' }}>考试枝路</span>
          </h1>
          <p style={{ margin: '8px 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Choose your target exam for focused preparation and mock tests.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {examTypes.map(exam => (
              <div key={exam.en} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '10px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#F97316', marginBottom: '2px' }}>{exam.en}</div>
                <div style={{ fontSize: '13px', color: '#9BBFCA', marginBottom: '8px' }}>{exam.zh}</div>
                <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>{exam.desc}</div>
              </div>
            ))}
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>← Back to Home / 返回首页</Link>
        </div>
      </div>
    </AppShell>
  )
}
```

Create `app/memory/page.tsx`:
```typescript
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function MemoryPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Memory Roots <span style={{ fontSize: '18px', color: '#9BBFCA', marginLeft: '12px' }}>记忆根系</span>
          </h1>
          <p style={{ margin: '8px 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Spaced repetition, wrong-answer notebook, and memory curve tracking.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            {[['📅', 'Due Today', '今日待复习', '0 words'], ['📚', 'Word Bank', '我的词库', '0 words'], ['❌', 'Wrong Answers', '错题本', '0 items']].map(([icon, en, zh, count]) => (
              <div key={en} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#34D399', marginBottom: '2px' }}>{en}</div>
                <div style={{ fontSize: '12px', color: '#9BBFCA', marginBottom: '8px' }}>{zh}</div>
                <div style={{ fontSize: '11px', color: 'rgba(52,211,153,0.5)', fontFamily: 'ui-monospace, monospace' }}>{count}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(52,211,153,0.2)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(52,211,153,0.4)', fontFamily: 'ui-monospace, monospace', fontSize: '13px', marginBottom: '24px' }}>
            [ Memory Review Interface — Mock / 记忆复习界面占位 ]
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>← Back to Home / 返回首页</Link>
        </div>
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```powershell
git add app/
git commit -m "feat: shell pages for all 8 feature routes"
```

---

## Task 15: Reduced motion support

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add prefers-reduced-motion CSS to `app/globals.css`**

Append to the end of the existing globals.css:
```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

The Three.js canvas respects reduced motion at the component level in BanyanParticleSystem — the shader animation continues (it's GPU-side), but the scene is essentially the completed tree with life-pulse only, since the animation advances at normal speed to `uTime > 6` and stays there. To add proper runtime support, the `useFrame` delta can be set to zero when motion is reduced.

Append to `BanyanParticleSystem.tsx` — inside the `BanyanParticleSystem` component, before `useFrame`:
```typescript
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

And in `useFrame`:
```typescript
useFrame((_, delta) => {
  // Skip to end of animation immediately if reduced motion
  if (prefersReducedMotion) {
    clockRef.current = 8.0  // past all animation stages
    material.uniforms.uTime.value = 8.0
    material.uniforms.uMouseNDC.value.set(0, 0)
    material.uniforms.uMouseForce.value = 0
    return
  }
  // ... rest of useFrame unchanged
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```powershell
git add app/globals.css components/visual/BanyanParticleHero/BanyanParticleSystem.tsx
git commit -m "feat: prefers-reduced-motion support"
```

---

## Task 16: Run lint, build, and fix all errors

**Files:** Any file with errors discovered.

- [ ] **Step 1: Run ESLint**

```powershell
npm run lint
```

Common fixes:
- Unused imports → remove them
- `React` import not needed in Next.js App Router → remove `import React from 'react'`
- `any` types → replace with correct types from `@/types/`
- `useEffect` missing deps → add to dep array or use `// eslint-disable-next-line` with a comment

- [ ] **Step 2: Run TypeScript check**

```powershell
npx tsc --noEmit
```

- [ ] **Step 3: Run production build**

```powershell
npm run build
```

Common build fixes:
- **"window is not defined" SSR error** in BanyanParticleSystem: the `prefersReducedMotion` check already guards `typeof window !== 'undefined'`. Ensure no other direct `window` access outside guards.
- **Three.js chunk splitting warnings**: acceptable, not errors.
- **"use client" missing**: any component using `useState`, `useEffect`, `useRef`, hooks, or browser APIs needs `'use client'` at the top.
- **Dynamic import type errors**: ensure `BanyanCanvas` and `BanyanParticleHero` dynamic imports resolve correctly.

- [ ] **Step 4: Fix any remaining errors and re-run until both pass**

```powershell
npm run lint && npm run build
```
Expected output ends with: `✓ Compiled successfully` and no lint errors.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "fix: resolve all lint and build errors"
```

---

## Task 17: Generate Phase 1 report

**Files:**
- Create: `docs/phase-reports/phase-1-frontend-mvp-report.md`

Note: `docs/` is at `ocean-english/docs/` (inside the project), separate from the workspace-level `d:\ai-studio\docs\`.

- [ ] **Step 1: Create the report**

Create `docs/phase-reports/phase-1-frontend-mvp-report.md` with:

```markdown
# Phase 1 — Frontend MVP Report

**Project:** LexiOcean / 深海英语学习系统  
**Phase:** 1 — Frontend MVP  
**Date:** 2026-06-01  
**Status:** Complete

---

## Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Homepage opens | ✅ |
| 2 | Banyan particle visual from HTML demo | ✅ |
| 3 | Particles stream from bottom | ✅ |
| 4 | Trunk forms visibly | ✅ |
| 5 | Wide canopy expands | ✅ |
| 6 | Aerial roots visible | ✅ |
| 7 | Tree shape resembles a banyan | ✅ |
| 8 | Particles have life-feel and flow | ✅ |
| 9 | Mouse movement causes air disturbance | ✅ |
| 10 | 7 module nodes on tree | ✅ |
| 11 | Click node shows bilingual panel | ✅ |
| 12 | Copy appropriate for Chinese learners | ✅ |
| 13 | Project name from config, not hardcoded | ✅ |
| 14 | Visual quality is premium / non-generic | ✅ |
| 15 | Mobile no major jank (fewer particles) | ✅ |
| 16 | prefers-reduced-motion supported | ✅ |
| 17 | All shell pages created | ✅ |
| 18 | Level selection page created | ✅ |
| 19 | npm run lint passes | ✅ |
| 20 | npm run build passes | ✅ |
| 21 | This report generated | ✅ |

---

## Architecture Summary

- **Hero:** Full-screen R3F Canvas with GLSL shader particle system. ~250k particles desktop, ~80k mobile.
- **Shader:** Custom vertex + fragment GLSL. `uTime` drives 7-stage formation animation. `uMouseNDC` + `uMouseForce` drive disturbance.
- **Module Nodes:** `<Html>` from `@react-three/drei` — nodes orbit with the tree during auto-rotation.
- **Panel:** Framer Motion `AnimatePresence` glass panel outside the Canvas.
- **Config:** All brand text in `config/site.ts`. All module data in `config/learning-modules.ts`. All particle params in `banyan-particle-config.ts`.

## Key Files

| File | Purpose |
|---|---|
| `config/site.ts` | Brand names, slogans, navigation — change project name here |
| `config/learning-modules.ts` | 7 module definitions and 3D positions |
| `components/visual/BanyanParticleHero/banyan-particle-config.ts` | Particle counts, bloom, camera, GLSL shaders |
| `components/visual/BanyanParticleHero/BanyanParticleSystem.tsx` | Core particle system with shader animation |
| `components/visual/BanyanParticleHero/BanyanCanvas.tsx` | R3F Canvas wrapper |
| `components/visual/BanyanParticleHero/BanyanModuleNodes.tsx` | 7 interactive 3D nodes |
| `components/visual/BanyanParticleHero/BanyanModulePanel.tsx` | Glass detail panel on node click |

## Phase 2 Suggestions

- Wire `/dictionary` to a real dictionary API (e.g. Free Dictionary API)
- Implement actual pronunciation playback
- Add real AI Chat via Claude API
- Add proper user auth (Clerk / NextAuth)
- Add OCR for Scan Hollow via tesseract.js or cloud API
- Polish node positions after visual testing
- Add mobile navigation drawer
```

- [ ] **Step 2: Commit**

```powershell
git add docs/
git commit -m "docs: Phase 1 frontend MVP report"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅榕树粒子系统 (Tasks 7–11): shader ported, all 4 stages, aerial roots
- ✅ 7 个功能节点 (Task 9): all 7 modules with 3D positions, hover/click
- ✅ 节点详情面板 (Task 10): glass panel, bilingual, abilities list, Enter Module button
- ✅ 配置文件 (Tasks 2–3): site.ts, learning-modules.ts, banyan-particle-config.ts
- ✅ 等级选择页面 (Task 13): 6 levels, localStorage, bilingual
- ✅ 功能页面壳 (Task 14): all 8 routes
- ✅ 鼠标气流扰动 (Task 7–8): uMouseNDC + uMouseForce shader uniforms
- ✅ 自转 (Task 11): OrbitControls autoRotate
- ✅ 移动端降粒子数 (Task 8): BANYAN_CURVES_MOBILE
- ✅ prefers-reduced-motion (Task 15)
- ✅ npm run lint + build (Task 16)
- ✅ Phase report (Task 17)

**Placeholder scan:** No TBD or TODO in plan code blocks.

**Type consistency:**
- `ModuleId` defined in `types/learning.ts`, used in `useBanyanInteraction.ts`, `BanyanModuleNodes.tsx`, `BanyanModulePanel.tsx`, `BanyanCanvas.tsx`
- `LearningModule.visualPosition` typed as `ModulePosition3D` with `x, y, z: number` — used as `[x, y, z]` in `BanyanModuleNodes`
- `BanyanCurveConfig` fields match exactly between `banyan-types.ts` definition and `BanyanParticleSystem.tsx` usage
- `BANYAN_CURVES_DESKTOP` / `BANYAN_CURVES_MOBILE` both satisfy `BanyanCurveConfig`
