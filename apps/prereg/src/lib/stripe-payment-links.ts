export const PLAN_PAYMENT_LINKS = {
  pro: 'https://buy.stripe.com/5kQcN5clSbLa5CU0f67wA04',
  premium: 'https://buy.stripe.com/00wcN55Xu16w4yQe5W7wA06',
  lifetime: 'https://buy.stripe.com/8x2aEXdpWbLa1mEge47wA05',
} as const

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
