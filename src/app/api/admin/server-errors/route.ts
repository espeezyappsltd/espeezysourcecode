import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
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

// GET /api/admin/server-errors — returns the 100 most-recent logged errors
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })

  try {
    const snapshot = await db.collection('server_error_log')
      .orderBy('created_at', 'desc')
      .limit(100)
      .get()

    const errors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ errors })
  } catch (dbErr: any) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }
}
