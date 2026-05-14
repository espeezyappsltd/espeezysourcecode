export function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROJECT_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY ?? '').trim()
  if (!url || !key) return null
  return { url, key }
}

export function isAdminRequest(req: Request): boolean {
  const token = req.headers.get('x-agent-key')?.trim() ?? ''
  const expected = process.env.AGENT_API_KEY?.trim() ?? ''
  return Boolean(expected) && token === expected
}

export async function supaRest(
  path: string,
  method: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<{ ok: boolean; data: unknown; status: number }> {
  const cfg = getSupabaseConfig()
  if (!cfg) return { ok: false, data: { error: 'Supabase is not configured.' }, status: 503 }

  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  return { ok: res.ok, data, status: res.status }
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
}
