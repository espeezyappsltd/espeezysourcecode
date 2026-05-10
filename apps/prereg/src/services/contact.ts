export type ContactSubmission = {
  name: string
  email: string
  category: string
  message: string
}

export async function submitContactForm(payload: ContactSubmission): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (res.ok) return { ok: true }

  const data = (await res.json().catch(() => ({}))) as { error?: string }
  return { ok: false, error: data.error ?? 'Something went wrong. Please try again.' }
}