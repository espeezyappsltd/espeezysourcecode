export type PreregisterSubmitPayload = {
  email: string
  source?: string
  referrer_code?: string
}

export type PreregisterResponse = {
  count?: number
  error?: string
  referral_code?: string
  referral_count?: number
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