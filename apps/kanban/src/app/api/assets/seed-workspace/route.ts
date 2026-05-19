import { NextRequest, NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { ensureUserWorkspaceSeed, seedWorkspaceForAllUsers } from '@/lib/assets/workspace-seed'

export const dynamic = 'force-dynamic'

/**
 * POST /api/assets/seed-workspace
 * - Default: seed folders + onboarding txt for the signed-in user
 * - ?all=1 (admin/dev): backfill every profile
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const all = new URL(req.url).searchParams.get('all') === '1'

    if (all) {
      const db = (await import('@/lib/supabase/admin')).getAdminDb()
      const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
      const isAdmin = profile?.role === 'admin' || profile?.role === 'ADMIN'
      const devOk = process.env.NODE_ENV !== 'production'

      if (!isAdmin && !devOk) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const result = await seedWorkspaceForAllUsers()
      return NextResponse.json({ ok: true, scope: 'all_users', ...result })
    }

    const result = await ensureUserWorkspaceSeed(user.id)
    return NextResponse.json({ ok: true, scope: 'current_user', userId: user.id, ...result })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Workspace seed failed' },
      { status: 500 },
    )
  }
}
