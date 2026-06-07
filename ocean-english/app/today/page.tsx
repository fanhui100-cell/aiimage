'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { useLearningStore } from '@/store/learningStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { useScanStore } from '@/store/scanStore'
import { StudyHero } from '@/components/study/StudyHero'
import { TodayMissionPanel } from '@/components/study/TodayMissionPanel'
import { ReviewQueuePanel } from '@/components/study/ReviewQueuePanel'
import { LexiGraphStudyCard } from '@/components/study/LexiGraphStudyCard'
import { RecentWordsPanel } from '@/components/study/RecentWordsPanel'
import { ScanLearningPanel } from '@/components/study/ScanLearningPanel'
import { AINavigatorPanel } from '@/components/study/AINavigatorPanel'
import { RecentActivityPanel } from '@/components/study/RecentActivityPanel'

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.3 },
  }
}

export default function TodayPage() {
  const {
    studyProgress,
    reviewWords,
    savedWords,
    getDueWords,
    autoResetDailyTasksIfNewDay,
  } = useLearningStore()

  const { lexiStar, dailyMissionProgress, ledger, resetDailyMissionsIfNewDay } =
    useMotivationStore()

  const { scanDocuments } = useScanHistoryStore()
  const { scanStudyNotes } = useScanStore()

  useEffect(() => {
    autoResetDailyTasksIfNewDay()
    resetDailyMissionsIfNewDay()
  }, [autoResetDailyTasksIfNewDay, resetDailyMissionsIfNewDay])

  const dueWords = getDueWords()
  const suggestedWord = reviewWords[0]?.word ?? savedWords[0] ?? 'ubiquitous'

  return (
    <AppShell>
      <PageShell maxWidth={1080} theme="light">
        <motion.div {...fadeUp(0)}>
          <StudyHero studyProgress={studyProgress} lexiStar={lexiStar} />
        </motion.div>

        <motion.div
          {...fadeUp(0.08)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
            <TodayMissionPanel progress={dailyMissionProgress} />
          </motion.div>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
            <ReviewQueuePanel dueWords={dueWords} totalReviewWords={reviewWords.length} />
          </motion.div>
        </motion.div>

        <motion.div {...fadeUp(0.15)}>
          <LexiGraphStudyCard suggestedWord={suggestedWord} />
        </motion.div>

        <motion.div
          {...fadeUp(0.22)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
            <RecentWordsPanel ledger={ledger} savedWords={savedWords} />
          </motion.div>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
            <ScanLearningPanel scanDocuments={scanDocuments} scanNoteCount={scanStudyNotes.length} />
          </motion.div>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
            <AINavigatorPanel />
          </motion.div>
        </motion.div>

        <motion.div {...fadeUp(0.3)}>
          <RecentActivityPanel ledger={ledger} />
        </motion.div>
      </PageShell>
    </AppShell>
  )
}
