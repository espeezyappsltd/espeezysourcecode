import { createBrowserSupabaseClient } from '@/lib/db-client'

export type PaidPlanKey = 'pro' | 'premium' | 'lifetime'

export async function startAuthenticatedCheckout(
  plan: PaidPlanKey,
): Promise<{ ok: boolean; url?: string; error?: string; openPortal?: boolean }> {
  const supabase = createBrowserSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { ok: false, error: 'Please sign in to upgrade.' }
  }

  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan }),
  })

  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; portal?: boolean }
  if (res.status === 409 && data.portal) {
    return { ok: false, error: data.error ?? 'Use Manage billing to change your plan.', openPortal: true }
  }
  if (!res.ok || !data.url) {
    return { ok: false, error: data.error ?? 'Unable to start checkout.' }
  }
  return { ok: true, url: data.url }
}

export type CheckoutStartResult = Awaited<ReturnType<typeof startAuthenticatedCheckout>>
