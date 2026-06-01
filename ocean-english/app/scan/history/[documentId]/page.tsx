import { AppShell } from '@/components/layout/AppShell'
import { ScanHistoryDetailClient } from '@/components/scan/history/ScanHistoryDetailClient'

export default async function ScanHistoryDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>
}) {
  const { documentId } = await params
  return (
    <AppShell>
      <ScanHistoryDetailClient documentId={documentId} />
    </AppShell>
  )
}
