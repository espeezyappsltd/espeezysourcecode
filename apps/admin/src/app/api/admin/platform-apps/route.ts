import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'
import { normalizePlatformAppRow, type PlatformApp, type PlatformAppStatus } from '@shared/platform-apps'

export const dynamic = 'force-dynamic'

const STATUSES: PlatformAppStatus[] = ['live', 'beta', 'development', 'coming_soon']

async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const profile = await getUserProfile(user.uid)
  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user }
}

export async function GET() {
  const gate = await requireAdmin()
  if ('error' in gate && gate.error) return gate.error

  const db = getAdminDb()
  const { data, error } = await db
    .from('platform_apps')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('[admin/platform-apps] GET', error)
    return NextResponse.json({ error: 'Failed to load apps.' }, { status: 500 })
  }

  const apps = (data ?? []).map((row) => normalizePlatformAppRow(row as Record<string, unknown>))
  return NextResponse.json({ apps })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if ('error' in gate && gate.error) return gate.error

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })
  }

  const slug = String((body as { slug?: string }).slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
  const name = String((body as { name?: string }).name ?? '').trim()

  if (!slug || !name) {
    return NextResponse.json({ error: 'slug and name are required.' }, { status: 400 })
  }

  const status = (body as { status?: string }).status
  const payload = buildPayload(body as Record<string, unknown>, { slug, name, status })

  const db = getAdminDb()
  const { data, error } = await db.from('platform_apps').insert(payload).select('*').single()

  if (error) {
    console.error('[admin/platform-apps] POST', error)
    return NextResponse.json({ error: error.message ?? 'Insert failed.' }, { status: 500 })
  }

  return NextResponse.json({ app: normalizePlatformAppRow(data as Record<string, unknown>) })
}

function buildPayload(
  body: Record<string, unknown>,
  required: { slug: string; name: string; status?: string },
): Omit<PlatformApp, 'id' | 'created_at' | 'updated_at'> & { updated_at: string } {
  const status =
    required.status && STATUSES.includes(required.status as PlatformAppStatus)
      ? (required.status as PlatformAppStatus)
      : 'development'

  return {
    slug: required.slug,
    name: required.name,
    tagline: String(body.tagline ?? ''),
    description: String(body.description ?? ''),
    status,
    price_cents: Number(body.price_cents ?? 0),
    price_currency: String(body.price_currency ?? 'GBP'),
    price_label: String(body.price_label ?? ''),
    stripe_payment_link:
      typeof body.stripe_payment_link === 'string' ? body.stripe_payment_link : null,
    download_url: typeof body.download_url === 'string' ? body.download_url : null,
    live_url: typeof body.live_url === 'string' ? body.live_url : null,
    icon_key: String(body.icon_key ?? 'layout'),
    accent_color: String(body.accent_color ?? '#6366f1'),
    features: Array.isArray(body.features)
      ? body.features.filter((x): x is string => typeof x === 'string')
      : [],
    setup_sections: Array.isArray(body.setup_sections) ? body.setup_sections : [],
    db_setup_markdown: String(body.db_setup_markdown ?? ''),
    ui_customization_markdown: String(body.ui_customization_markdown ?? ''),
    includes_source: Boolean(body.includes_source ?? true),
    sort_order: Number(body.sort_order ?? 0),
    published: Boolean(body.published ?? true),
    updated_at: new Date().toISOString(),
  }
}
