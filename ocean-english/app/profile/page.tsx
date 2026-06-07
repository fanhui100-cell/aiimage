import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { ProfileBody } from '@/components/profile/ProfileBody'
import { redirect } from 'next/navigation'

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
      <PageShell maxWidth={700} theme="light">
        <ProfileBody userEmail={user.email ?? ''} createdAt={user.created_at} />
      </PageShell>
    </AppShell>
  )
}
