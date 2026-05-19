import { ESPEEZY_APP_ORIGINS } from './app-url'

/** Marketing site (prereg) — single source of truth for plans, pricing, and checkout UI. */
export type MarketingPlanKey = 'pro' | 'premium' | 'lifetime'

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

/** Server or client: marketing app origin (defaults to espeezy.com). */
export function getMarketingOrigin(): string {
  const env =
    process.env.NEXT_PUBLIC_MARKETING_URL?.trim() ||
    process.env.NEXT_PUBLIC_PREREG_URL?.trim()
  if (env) return normalizeOrigin(env)
  return normalizeOrigin(ESPEEZY_APP_ORIGINS.prereg)
}

export function marketingPricingUrl(): string {
  return `${getMarketingOrigin()}/pricing`
}

export function marketingCheckoutUrl(
  plan: MarketingPlanKey = 'pro',
  query?: Record<string, string | undefined>,
): string {
  const url = new URL(`${getMarketingOrigin()}/checkout`)
  url.searchParams.set('plan', plan)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) url.searchParams.set(key, value)
  }
  return url.toString()
}

export function marketingCheckoutSuccessUrl(plan?: MarketingPlanKey): string {
  const url = new URL(`${getMarketingOrigin()}/checkout/success`)
  if (plan) url.searchParams.set('plan', plan)
  return url.toString()
}
