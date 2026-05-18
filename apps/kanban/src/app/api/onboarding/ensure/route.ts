import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { ensureOnboardingTasksForUser } from '@/lib/onboarding/onboarding-service'

export const dynamic = 'force-dynamic'

/** POST /api/onboarding/ensure — seed onboarding tasks in To Do for current user */
export async function POST() {
  try {
    const user = await getRequestUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = (await import('@/lib/supabase/admin')).getAdminDb()
    const { data: profile } = await db.from('profiles').select('group_id').eq('id', user.id).single()

    if (!profile?.group_id) {
      return NextResponse.json({ error: 'Join a team workspace first.' }, { status: 400 })
    }

    const result = await ensureOnboardingTasksForUser(user.id, profile.group_id)
    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
