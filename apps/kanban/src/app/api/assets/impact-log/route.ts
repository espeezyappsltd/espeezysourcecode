import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { getImpactLogForUser } from '@/lib/assets/impact-log'
import { friendlySupabaseError } from '@/utils/supabase-errors'

export const dynamic = 'force-dynamic'

/** GET /api/assets/impact-log — verifiable marketplace + hustle impact timeline */
export async function GET() {
  try {
    const user = await getRequestUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await getImpactLogForUser(user.id)
    return NextResponse.json(payload)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: friendlySupabaseError(message, 'Failed to load impact log') },
      { status: 500 },
    )
  }
}
