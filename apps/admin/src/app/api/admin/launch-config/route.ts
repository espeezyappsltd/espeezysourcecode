import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getAdminDb()

  const keys = ['launch_date', 'launch_message', 'preregister_goal', 'preregister_open', 'brand_name']
  const config: Record<string, any> = {}

  try {
    const { data, error } = await db
      .from('app_config')
      .select('key, value')
      .in('key', keys)

    if (error) {
      throw error
    }

    for (const row of data ?? []) {
      config[row.key] = row.value
    }

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

  const updates: Array<{ key: string; value: string }> = await req.json()
  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Expected array of {key, value} pairs.' }, { status: 400 })
  }

  const ALLOWED_KEYS = ['launch_date', 'launch_message', 'preregister_goal', 'preregister_open', 'brand_name', 'platform_version']
  const filtered = updates.filter(u => ALLOWED_KEYS.includes(u.key) && typeof u.value === 'string')

  try {
    const now = new Date().toISOString()

    const payload = filtered.map((u) => ({
      key: u.key,
      value: u.value,
      updated_at: now,
      updated_by: user.uid,
    }))

    const { error } = await db
      .from('app_config')
      .upsert(payload, { onConflict: 'key' })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin-config] batch update error:', error)
    return NextResponse.json({ error: 'Failed to save configuration.' }, { status: 500 })
  }
}
