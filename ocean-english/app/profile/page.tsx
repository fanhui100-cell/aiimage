import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Home / 返回首页
          </Link>
        </div>

        <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700, color: '#ECFBFF' }}>
          Profile <span style={{ fontSize: '16px', color: '#9BBFCA' }}>个人中心</span>
        </h1>

        {/* Account info */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.12)', borderRadius: '12px', padding: '20px 22px', marginTop: '24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(56,189,248,0.6)', fontFamily: 'ui-monospace, monospace', marginBottom: '10px', letterSpacing: '0.1em' }}>
            ACCOUNT / 账户
          </div>
          <div style={{ fontSize: '15px', color: '#ECFBFF', marginBottom: '4px' }}>{user.email}</div>
          <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', fontFamily: 'ui-monospace, monospace' }}>
            Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Sync mode notice */}
        <div style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#34D399', fontWeight: 600, marginBottom: '4px' }}>
            ✓ Local-first + Cloud Sync Active / 本地优先 + 云端同步已启用
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.7)', lineHeight: 1.6 }}>
            Your learning data is saved locally and synced to the cloud when you study.
            Local data migration tool coming in Phase 5.5.
            <br />
            <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>
              学习数据本地保存，学习时同步到云端。历史本地数据迁移工具将在 Phase 5.5 提供。
            </span>
          </div>
        </div>

        {/* Cloud stats placeholder — will be populated in Phase 5C */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.1)', borderRadius: '10px', padding: '16px 18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(56,189,248,0.6)', fontFamily: 'ui-monospace, monospace', marginBottom: '12px', letterSpacing: '0.1em' }}>
            CLOUD DATA / 云端数据
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(155,191,202,0.5)', fontStyle: 'italic' }}>
            Cloud data statistics will appear here after Phase 5C database setup.
            <br />
            <span style={{ fontSize: '12px' }}>云端数据统计将在 Phase 5C 数据库配置后显示。</span>
          </div>
        </div>

        {/* Sign out */}
        <form action="/auth/logout" method="POST">
          <button
            type="submit"
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'rgba(239,68,68,0.7)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Sign Out / 登出
          </button>
        </form>
      </div>
    </div>
  )
}
