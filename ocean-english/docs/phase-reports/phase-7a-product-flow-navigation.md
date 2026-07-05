# Phase 7A: Product Flow + Navigation Integration

**Status:** Complete — passes lint + build  
**Date:** 2026-06-03  
**Previous:** Phase 6H (Dictionary Expansion + Search Upgrade)

---

## 1. Executive Summary

Phase 7A integrates the independently-built modules into a coherent product flow. The main navbar now surfaces the two highest-value features (LexiGraph, Scan) that were previously invisible. The home page has actionable learning CTAs below the hero. Every major module has "next step" links connecting it to the rest of the system.

---

## 2. Files Added (4)

| File | Purpose |
|------|---------|
| `lib/product-flow/routes.ts` | Centralized route constants |
| `components/navigation/MoreMenu.tsx` | Dropdown for secondary nav items |
| `components/product-flow/HomeLearningCTA.tsx` | Home page learning entry cards |
| `docs/phase-reports/phase-7a-product-flow-navigation.md` | This document |

---

## 3. Files Modified (11)

| File | Change |
|------|--------|
| `config/site.ts` | New 7-item `navigation` + `navigationMore` arrays |
| `components/layout/Navbar.tsx` | Home link, reordered items, MoreMenu, active state |
| `app/page.tsx` | Added `<HomeLearningCTA />` below hero |
| `components/lexigraph/LexiGraphPanel.tsx` | Already had Ask AI inline — confirmed no change needed |
| `app/memory/page.tsx` | LexiGraph ✦ icons on word cards; Start Quiz on Review tab; Ask AI + LexiGraph on Wrong Answers |
| `app/quiz/page.tsx` | Added Ask AI + Continue Review + Return to LexiGraph on completion screen |
| `components/scan/ExtractedVocabularyPanel.tsx` | Word name → clickable Link to Word Detail; ✦ icon → LexiGraph |
| `data/mock-chat.ts` | Updated `suggestedPrompts` — added "Generate a quiz", clearer labels |
| `app/study/page.tsx` | Added LexiGraph as first learning path card |
| `app/exam/page.tsx` | Added Back to Study + Quiz More Words + LexiGraph links |

---

## 4. Navigation Structure

### Before

```
[Logo] | Dictionary  Study  Quiz  Exam  Memory  AI Chat | [Choose Level] [User]
```
- 6 items: LexiGraph and Scan invisible
- No Home link in navbar
- Risk of overflow on 1280px screens

### After

```
[Logo] | Home  LexiGraph  Dictionary  Review  Scan  AI Chat  More▼ | [Choose Level] [User]
```

**More▼ dropdown:** Quiz, Study, Exam, Pronunciation, Reading, Wrong Answers, Universe

- 7 primary items fit ~634px (safe on 1280px)
- Active page highlighted in cyan
- More dropdown closes on outside click or item selection
- "Memory" renamed "Review" for clearer action orientation

---

## 5. Homepage CTA

`HomeLearningCTA` renders below the Banyan hero (scroll to see):

**Row 1 — 2 large cards:**
- Start Learning / 开始学习 → `/study`
- Enter LexiGraph / 进入词汇星图 → `/lexigraph`

**Row 2 — 3 smaller cards:**
- Continue Review / 继续复习 → `/memory` (shows due count badge if > 0)
- Scan a Document / 扫描文档 → `/scan`
- Ask AI Navigator / 问 AI 导学 → `/chat`

---

## 6. Core User Paths — Status

| Path | Status after 7A |
|------|----------------|
| A: Home → LexiGraph → Word Detail → Review → Memory → Quiz | **Connected** |
| B: Dictionary → Word Detail → LexiGraph → Ask AI → Review | **Connected** (Ask AI already in LexiGraph panel) |
| C: Scan → Vocab → Word Detail/LexiGraph → Review → Memory | **Connected** (vocab words now link to Detail + LexiGraph) |
| D: Memory → Quiz → Wrong Answers → Ask AI | **Connected** |
| E: AI Chat → Explain → Quiz → Review | **Improved** (clearer prompt shortcuts) |

---

## 7. Per-Page CTA Summary

| Page | CTAs added |
|------|-----------|
| `/` | 5-card learning CTA section |
| `/dictionary` | LexiGraph entry card already present ✓ |
| `/word/[slug]` | All CTAs already present ✓ |
| `/lexigraph` | Ask AI inline already present ✓ |
| `/memory` | ✦ LexiGraph on all word cards; Start Quiz on Review tab; Ask AI + LexiGraph on Wrong Answers |
| `/quiz` | Ask AI + Continue Review + Return to LexiGraph on completion |
| `/scan` vocab panel | Word name → Word Detail; ✦ → LexiGraph per vocab item |
| `/chat` | Improved prompt shortcuts (Generate quiz, clearer labels) |
| `/study` | LexiGraph added as first path card |
| `/exam` | Back to Study, Quiz More Words, LexiGraph links |

---

## 8. Files Not Touched

All Phase 5 auth/Supabase files, all Phase 6 dictionary/lexigraph/pronunciation core logic, scan pipeline, AI provider config, motivation/companion stores, quiz engine logic, word detail core structure.

---

## 9. Test Results

```
npm run lint   → No errors ✓
npm run build  → 46 routes, TypeScript OK ✓
```
