import { NextRequest, NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { ensureOnboardingTasksForUser } from '@/lib/onboarding/onboarding-service'
import { isPersistedTaskId } from '@/lib/tasks/task-ids'

export const dynamic = 'force-dynamic'

/** POST /api/onboarding/ensure — seed onboarding tasks in To Do for current user */
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json().catch(() => ({}))) as { groupId?: string }
    const db = (await import('@/lib/supabase/admin')).getAdminDb()
    const { data: profile } = await db.from('profiles').select('group_id').eq('id', user.id).single()

    const resolvedGroupId =
      typeof body.groupId === 'string' && isPersistedTaskId(body.groupId)
        ? body.groupId
        : profile?.group_id ?? null

    if (!resolvedGroupId) {
      return NextResponse.json({ error: 'Join a team workspace first.' }, { status: 400 })
    }

    if (profile?.group_id && profile.group_id !== resolvedGroupId) {
      return NextResponse.json({ error: 'Team workspace mismatch.' }, { status: 403 })
    }

    const result = await ensureOnboardingTasksForUser(user.id, resolvedGroupId)
    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
