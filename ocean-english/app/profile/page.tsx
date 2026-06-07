import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ProfileCloudStats } from '@/components/auth/ProfileCloudStats'
import { MigrationPrompt } from '@/components/auth/MigrationPrompt'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage() {
  if (!isSupabaseConfigured) {
    redirect('/')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <AppShell>
      <PageShell maxWidth={700}>
        <div style={{ marginBottom: '8px', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(56,189,248,0.45)', fontFamily: 'var(--font-mono)' }}>
          LEXIOCEAN / PROFILE
        </div>
        <h1 style={{ margin: '0 0 24px', fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 700, color: '#ECFBFF' }}>
          Profile <span style={{ fontSize: '16px', color: '#9BBFCA' }}>个人中心</span>
        </h1>

        <SectionHeader label="ACCOUNT" labelZh="账户" style={{ marginBottom: '10px' }} />
        <GlassCard style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', color: '#ECFBFF', marginBottom: '4px', fontWeight: 600 }}>{user.email}</div>
          <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', fontFamily: 'var(--font-mono)' }}>
            Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </GlassCard>

        <GlassCard accentColor="#34D399" style={{ marginBottom: '16px', border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.03)' }}>
          <div style={{ fontSize: '13px', color: '#34D399', fontWeight: 600, marginBottom: '4px' }}>
            ✓ Local-first + Cloud Sync Active / 本地优先 + 云端同步已启用
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.7)', lineHeight: 1.6 }}>
            Your learning data is saved locally and synced to the cloud when you study.
            <br />
            <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.45)' }}>
              学习数据本地保存，学习时同步到云端。
            </span>
          </div>
        </GlassCard>

        <MigrationPrompt />

        <ProfileCloudStats />

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <form action="/auth/logout" method="POST">
            <Button type="submit" variant="danger" size="sm">Sign Out / 登出</Button>
          </form>
          <Link href="/" style={{ fontSize: '13px', color: 'rgba(155,191,202,0.55)', textDecoration: 'none' }}>
            ← Home / 返回首页
          </Link>
        </div>
      </PageShell>
    </AppShell>
  )
}
