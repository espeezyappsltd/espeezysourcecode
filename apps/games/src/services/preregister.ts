export async function fetchPreregisterCount(): Promise<number | null> {
  try {
    const response = await fetch('/api/preregister', {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) return null

    const data = await response.json().catch(() => ({}))
    return typeof data.count === 'number' ? data.count : null
  } catch {
    return null
  }
}

export async function submitPreregister(payload: {
  email: string
  source?: string
}): Promise<{ ok: boolean; error?: string; count?: number }> {
  try {
    const response = await fetch('/api/preregister', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        ok: false,
        error: typeof data.error === 'string' ? data.error : 'Failed to register',
      }
    }

    return {
      ok: true,
      count: typeof data.count === 'number' ? data.count : undefined,
    }
  } catch (error) {
    return {
      ok: false,
      error: 'Network error. Please try again.',
    }
  }
}
