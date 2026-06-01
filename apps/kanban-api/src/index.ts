export interface Env {
  SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY: string
  MARKETING_ORIGIN?: string
}

type JsonRecord = Record<string, unknown>

function json(data: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function supabaseRestBase(env: Env): string {
  const base = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) throw new Error('Supabase URL is not configured')
  return `${base.replace(/\/$/, '')}/rest/v1`
}

function supabaseHeaders(env: Env): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'content-type': 'application/json',
  }
}

async function handleContact(req: Request, env: Env): Promise<Response> {
  const payload = (await req.json().catch(() => ({}))) as {
    name?: string
    email?: string
    category?: string
    message?: string
  }
  const message = (payload.message ?? '').trim()
  if (!message) return json({ error: 'Message is required' }, 400)

  const senderName = (payload.name ?? '').trim()
  const senderEmail = (payload.email ?? '').trim()
  const finalMessage =
    senderName || senderEmail
      ? `Sender: ${senderName || 'Unknown'} <${senderEmail || 'unknown'}>\n\n${message}`
      : message

  const res = await fetch(`${supabaseRestBase(env)}/user_feedback`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(env),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: null,
      message: finalMessage,
      category: (payload.category ?? 'General').toString(),
      created_at: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    return json({ error: 'Failed to save feedback' }, 500)
  }
  return json({ success: true }, 201)
}

async function handleLaunchConfig(env: Env): Promise<Response> {
  const keys = [
    'launch_date',
    'launch_message',
    'preregister_goal',
    'preregister_open',
    'brand_name',
    'platform_version',
  ]
  const url = `${supabaseRestBase(env)}/app_config?select=key,value`

  const res = await fetch(url, {
    headers: supabaseHeaders(env),
  })
  if (!res.ok) return json({ config: {} }, 200)

  const rows = (await res.json().catch(() => [])) as Array<{ key: string; value: unknown }>
  const config: Record<string, unknown> = {}
  for (const row of rows) {
    if (keys.includes(row.key)) config[row.key] = row.value
  }

  return new Response(JSON.stringify({ config }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}

async function handleLiveMetrics(env: Env): Promise<Response> {
  const origin = (env.MARKETING_ORIGIN || 'https://espeezy.com').replace(/\/$/, '')
  try {
    const res = await fetch(`${origin}/api/live-metrics`, { cf: { cacheTtl: 0, cacheEverything: false } })
    if (!res.ok) throw new Error('upstream failed')
    const body = await res.text()
    return new Response(body, {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  } catch {
    return json({ lifetime_seats_used: 0, lifetime_seats_remaining: 100 })
  }
}

function handleHealth(): Response {
  return json({
    status: 'ok',
    platform: 'cloudflare-workers',
    checks: [{ name: 'worker', healthy: true }],
    timestamp: new Date().toISOString(),
  })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const { pathname } = url

    if (req.method === 'POST' && pathname === '/api/contact') {
      return handleContact(req, env)
    }
    if (req.method === 'GET' && pathname === '/api/launch-config') {
      return handleLaunchConfig(env)
    }
    if (req.method === 'GET' && pathname === '/api/live-metrics') {
      return handleLiveMetrics(env)
    }
    if (req.method === 'GET' && pathname === '/api/health') {
      return handleHealth()
    }

    return json({ error: 'Not found' }, 404)
  },
}
