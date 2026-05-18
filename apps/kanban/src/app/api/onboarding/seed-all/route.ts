import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { seedOnboardingForAllUsers } from '@/lib/onboarding/onboarding-service'

export const dynamic = 'force-dynamic'

/** POST /api/onboarding/seed-all — seed onboarding tasks for every user with a group (admin/dev) */
export async function POST() {
  try {
    const user = await getRequestUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = (await import('@/lib/supabase/admin')).getAdminDb()
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'ADMIN'
    const devOk = process.env.NODE_ENV !== 'production'

    if (!isAdmin && !devOk) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await seedOnboardingForAllUsers()
    return NextResponse.json({ ok: true, ...result })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
