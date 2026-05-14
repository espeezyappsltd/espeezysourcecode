type PreregisterSubmitPayload = {
  email: string
  password?: string
  fullName?: string
  institution?: string
  role?: string
  source?: string
  referrer_code?: string
}

export type PreregisterResponse = {
  count?: number
  error?: string
  login_ready?: boolean
  referral_code?: string
  referral_count?: number
  message?: string
}

export async function fetchPreregisterCount(signal?: AbortSignal): Promise<number | null> {
  try {
    const res = await fetch('/api/preregister', {
      cache: 'no-store',
      ...(signal ? { signal } : {}),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { count?: unknown }
    return typeof data.count === 'number' ? data.count : null
  } catch {
    return null
  }
}

export async function submitPreregistration(payload: PreregisterSubmitPayload): Promise<{
  ok: boolean
  data: PreregisterResponse
}> {
  const res = await fetch('/api/preregister', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = (await res.json().catch(() => ({}))) as PreregisterResponse
  return { ok: res.ok, data }
}