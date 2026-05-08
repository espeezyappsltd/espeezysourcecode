// Live Stripe Payment Link fallbacks — override per environment via NEXT_PUBLIC_STRIPE_LINK_* env vars
const LIVE_LINKS = {
  pro:      'https://buy.stripe.com/5kQcN5clSbLa5CU0f67wA04',
  premium:  'https://buy.stripe.com/00wcN55Xu16w4yQe5W7wA06',
  lifetime: 'https://buy.stripe.com/aFacN5bhO02s7L25zq7wA0e',
} as const

export const PLAN_PAYMENT_LINKS = {
  pro:      (process.env.NEXT_PUBLIC_STRIPE_LINK_PRO      ?? LIVE_LINKS.pro).trim(),
  premium:  (process.env.NEXT_PUBLIC_STRIPE_LINK_PREMIUM  ?? LIVE_LINKS.premium).trim(),
  lifetime: (process.env.NEXT_PUBLIC_STRIPE_LINK_LIFETIME ?? LIVE_LINKS.lifetime).trim(),
}

export type PlanKey = keyof typeof PLAN_PAYMENT_LINKS

export function getPlanKey(value: string | null | undefined): PlanKey {
  if (value === 'premium' || value === 'lifetime') {
    return value
  }

  return 'pro'
}

export function buildStripePaymentLink(
  plan: PlanKey,
  query?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) {
      params.set(key, value)
    }
  }

  const qs = params.toString()
  return `${PLAN_PAYMENT_LINKS[plan]}${qs ? `?${qs}` : ''}`
}
