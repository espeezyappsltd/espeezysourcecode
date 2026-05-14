import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const clickSchema = z.object({
  amountCents: z.coerce.number().int().min(0).max(1_000_000).optional(),
  source: z.string().trim().max(80).optional(),
  featureTag: z.string().trim().max(120).optional(),
  actorKey: z.string().trim().max(128).optional(),
  context: z.string().trim().max(120).optional(),
})

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROJECT_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY ?? '').trim()
  if (!url || !key) return null
  return { url, key }
}

function buildFallbackActorKey(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? ''
  const userAgent = req.headers.get('user-agent') ?? ''
  if (!ip && !userAgent) return null
  const hash = createHash('sha256').update(`${ip}|${userAgent}`).digest('hex')
  return hash.slice(0, 64)
}

export async function POST(req: Request) {
  const cfg = getSupabaseConfig()
  if (!cfg) {
    return NextResponse.json({ ok: false, error: 'Metrics store unavailable' }, { status: 503 })
  }

  const raw = await req.json().catch(() => ({}))
  const parsed = clickSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 422 })
  }

  const source = parsed.data.source || 'fund_page'
  const actorKey = parsed.data.actorKey || buildFallbackActorKey(req)

  const payload = {
    event_type: 'donate_click',
    actor_key: actorKey,
    amount_cents: parsed.data.amountCents ?? 0,
    source,
    metadata: {
      feature_tag: parsed.data.featureTag || null,
      context: parsed.data.context || null,
      app: 'prereg',
    },
  }

  const res = await fetch(`${cfg.url}/rest/v1/donation_events`, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  }).catch(() => null)

  if (!res || !res.ok) {
    return NextResponse.json({ ok: false, error: 'Unable to track click' }, { status: 503 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
