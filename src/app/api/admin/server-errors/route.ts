import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const profile = await getUserProfile(user.uid)
  if (!profile) {
    return { user: null, error: NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 }) }
  }
  if ((profile as any).role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}

// GET /api/admin/server-errors  -  returns the 100 most-recent logged errors
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const db = getAdminDb()

  try {
    const { data, error: dbErr } = await db
      .from('server_error_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (dbErr) {
      throw dbErr
    }

    return NextResponse.json({ errors: data ?? [] })
  } catch (dbErr: any) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }
}
