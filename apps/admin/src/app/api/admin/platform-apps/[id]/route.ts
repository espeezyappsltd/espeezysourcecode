import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'
import { normalizePlatformAppRow, type PlatformAppStatus } from '@shared/platform-apps'

export const dynamic = 'force-dynamic'

const STATUSES: PlatformAppStatus[] = ['live', 'beta', 'development', 'coming_soon']

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const profile = await getUserProfile(user.uid)
  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user }
}

export async function PUT(req: Request, context: RouteContext) {
  const gate = await requireAdmin()
  if ('error' in gate && gate.error) return gate.error

  const { id } = await context.params
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const allowed = [
    'name',
    'tagline',
    'description',
    'status',
    'price_cents',
    'price_currency',
    'price_label',
    'stripe_payment_link',
    'download_url',
    'live_url',
    'icon_key',
    'accent_color',
    'features',
    'setup_sections',
    'db_setup_markdown',
    'ui_customization_markdown',
    'includes_source',
    'sort_order',
    'published',
  ] as const

  for (const key of allowed) {
    if (key in (body as object)) {
      if (key === 'status') {
        const s = String((body as { status?: string }).status)
        if (!STATUSES.includes(s as PlatformAppStatus)) continue
      }
      patch[key] = (body as Record<string, unknown>)[key]
    }
  }

  const db = getAdminDb()
  const { data, error } = await db
    .from('platform_apps')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[admin/platform-apps/[id]] PUT', error)
    return NextResponse.json({ error: error.message ?? 'Update failed.' }, { status: 500 })
  }

  return NextResponse.json({ app: normalizePlatformAppRow(data as Record<string, unknown>) })
}

export async function DELETE(_req: Request, context: RouteContext) {
  const gate = await requireAdmin()
  if ('error' in gate && gate.error) return gate.error

  const { id } = await context.params
  const db = getAdminDb()
  const { error } = await db.from('platform_apps').delete().eq('id', id)

  if (error) {
    console.error('[admin/platform-apps/[id]] DELETE', error)
    return NextResponse.json({ error: error.message ?? 'Delete failed.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
