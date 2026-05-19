import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db'
import { backfillGroupContributionScores } from '@/lib/tasks/contribution-score'

export const dynamic = 'force-dynamic'

/** POST — award seed points for Done tasks in the user's group that were never scored. */
export async function POST(req: Request) {
  const db = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let groupId: string | undefined
  try {
    const body = (await req.json().catch(() => ({}))) as { groupId?: string }
    groupId = body.groupId
  } catch {
    /* empty body ok */
  }

  if (!groupId) {
    const { data: profile } = await db.from('profiles').select('group_id').eq('id', user.id).single()
    groupId = profile?.group_id ?? undefined
  }

  if (!groupId) {
    return NextResponse.json({ tasksProcessed: 0, usersAwarded: 0 })
  }

  const { data: membership } = await db.from('profiles').select('group_id').eq('id', user.id).single()
  if (membership?.group_id !== groupId) {
    return NextResponse.json({ error: 'Not a member of this team.' }, { status: 403 })
  }

  const result = await backfillGroupContributionScores(groupId)
  return NextResponse.json(result)
}
