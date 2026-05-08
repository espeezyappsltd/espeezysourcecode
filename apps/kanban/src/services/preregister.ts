export type PreregisterPayload = {
  email: string
  source: string
}

type PreregisterResponse = {
  count?: number
  error?: string
}

async function readPreregisterResponse(response: Response): Promise<PreregisterResponse> {
  const raw = await response.text()

  if (!raw) {
    return {}
  }

  const parsed: unknown = JSON.parse(raw)

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
  const response = await fetch('/api/preregister', { method: 'GET' })

  if (!response.ok) {
    return null
  }

  const data = await readPreregisterResponse(response)
  return typeof data.count === 'number' ? data.count : null
}

export async function submitPreregister(payload: PreregisterPayload) {
  const response = await fetch('/api/preregister', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await readPreregisterResponse(response)

  return {
    ok: response.ok,
    count: typeof data.count === 'number' ? data.count : null,
    error: data.error,
  }
}
