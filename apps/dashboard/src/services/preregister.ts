export type PreregisterPayload = {
  email: string
  source: string
  password?: string
  fullName?: string
  institution?: string
  role?: string
}

type PreregisterResponse = {
  count?: number
  error?: string
}

const PREREGISTER_API_PATH = '/api/preregister'

async function readPreregisterResponse(response: Response): Promise<PreregisterResponse> {
  const raw = await response.text()

  if (!raw) {
    return {}
  }

  let parsed: unknown = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }

  if (!parsed || typeof parsed !== 'object') {
    return {}
  }

  const { count, error } = parsed as Record<string, unknown>

  return {
    count: typeof count === 'number' ? count : undefined,
    error: typeof error === 'string' ? error : undefined,
  }
}

export async function fetchPreregisterCount() {
  const response = await fetch(PREREGISTER_API_PATH, { method: 'GET', cache: 'no-store' })

  if (!response.ok) {
    return null
  }

  const data = await readPreregisterResponse(response)
  return typeof data.count === 'number' ? data.count : null
}

export async function submitPreregister(payload: PreregisterPayload) {
  const response = await fetch(PREREGISTER_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await readPreregisterResponse(response)

  let latestCount: number | null = typeof data.count === 'number' ? data.count : null

  if (response.ok && latestCount === null) {
    latestCount = await fetchPreregisterCount()
  }

  return {
    ok: response.ok,
    count: latestCount,
    error: data.error,
  }
}
