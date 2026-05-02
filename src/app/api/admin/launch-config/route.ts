import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getAdminDb()
  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
  }

  const keys = ['launch_date', 'launch_message', 'preregister_goal', 'preregister_open', 'brand_name']
  const config: Record<string, any> = {}

  try {
    const snapshots = await Promise.all(
      keys.map(key => db.collection('app_config').doc(key).get())
    )

    snapshots.forEach((doc, index) => {
      if (doc.exists) {
        config[keys[index]] = doc.data()?.value
      }
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('[launch-config] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile(user.uid)
  if (!profile || (profile as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = getAdminDb()
  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
  }

  const updates: Array<{ key: string; value: string }> = await req.json()
  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Expected array of {key, value} pairs.' }, { status: 400 })
  }

  const ALLOWED_KEYS = ['launch_date', 'launch_message', 'preregister_goal', 'preregister_open', 'brand_name', 'platform_version']
  const filtered = updates.filter(u => ALLOWED_KEYS.includes(u.key) && typeof u.value === 'string')

  try {
    const batch = db.batch()
    const now = new Date().toISOString()

    filtered.forEach(u => {
      const ref = db.collection('app_config').doc(u.key)
      batch.set(ref, {
        key: u.key,
        value: u.value,
        updated_at: now,
        updated_by: user.uid,
      }, { merge: true })
    })

    await batch.commit()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin-config] batch update error:', error)
    return NextResponse.json({ error: 'Failed to save configuration.' }, { status: 500 })
  }
}
