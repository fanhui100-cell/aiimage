import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST() {
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/', redirectBase))
}
