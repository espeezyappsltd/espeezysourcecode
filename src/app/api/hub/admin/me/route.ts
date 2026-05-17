import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser().catch(() => ({ data: { user: null } }))

  if (!user) {
    return NextResponse.json({ member: null })
  }

  const svc = createAdminClient()
  const { data: member } = await svc
    .from('admin_members')
    .select('username, email, admin_role, display_name, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ member: null })
  }

  return NextResponse.json({ member })
}
