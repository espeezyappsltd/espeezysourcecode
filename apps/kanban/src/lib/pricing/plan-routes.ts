import type { MarketingPlanKey } from '@/lib/marketing-urls'
import { LIFETIME_CTA_AVAILABLE, LIFETIME_CTA_SOLD_OUT } from '@shared/platform-brand'

export type PricingPlanId = 'free' | MarketingPlanKey

export const APP_PRICING_PATH = '/pricing'

const PLAN_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  premium: 2,
  lifetime: 3,
}

export function normalizePricingPlanId(value: string | null | undefined): PricingPlanId | null {
  if (value === 'free' || value === 'pro' || value === 'premium' || value === 'lifetime') {
    return value
  }
  return null
}

export function planRank(plan: string | null | undefined): number {
  if (!plan) return 0
  return PLAN_RANK[plan.toLowerCase()] ?? 0
}

export function planMeetsOrExceeds(current: string | null | undefined, target: PricingPlanId): boolean {
  return planRank(current) >= planRank(target)
}

export function getCheckoutPath(plan: MarketingPlanKey): string {
  return `/checkout?plan=${plan}`
}

/** Login/signup URL for a chosen plan (paid plans continue to checkout after auth). */
export function getSignupLoginPath(plan: PricingPlanId): string {
  if (plan === 'free') {
    return '/login?signup=true'
  }
  const params = new URLSearchParams({
    signup: 'true',
    plan,
    next: getCheckoutPath(plan),
  })
  return `/login?${params}`
}

export type PlanCtaOptions = {
  plan: PricingPlanId
  isAuthenticated: boolean
  currentPlan?: string | null
  userId?: string | null
  lifetimeSoldOut?: boolean
}

export function getPlanCtaHref({
  plan,
  isAuthenticated,
  currentPlan,
  userId,
  lifetimeSoldOut,
}: PlanCtaOptions): string {
  if (lifetimeSoldOut && plan === 'lifetime') {
    return APP_PRICING_PATH
  }

  const current = (currentPlan ?? 'free').toLowerCase()

  if (isAuthenticated && planMeetsOrExceeds(current, plan)) {
    if (plan === 'free') return '/'
    return '/settings?tab=billing'
  }

  if (plan === 'free') {
    return isAuthenticated ? '/' : getSignupLoginPath('free')
  }

  if (isAuthenticated) {
    const q = new URLSearchParams({ plan })
    if (userId) q.set('uid', userId)
    return `/checkout?${q}`
  }

  return getSignupLoginPath(plan)
}

export function getPlanCtaLabel({
  plan,
  isAuthenticated,
  currentPlan,
  lifetimeSoldOut,
}: Omit<PlanCtaOptions, 'userId'>): string {
  if (lifetimeSoldOut && plan === 'lifetime') return LIFETIME_CTA_SOLD_OUT

  const current = (currentPlan ?? 'free').toLowerCase()

  if (isAuthenticated && planMeetsOrExceeds(current, plan)) {
    if (plan === 'free') return 'Go to dashboard'
    return 'Manage billing'
  }

  switch (plan) {
    case 'free':
      return isAuthenticated ? 'Go to dashboard' : 'Sign up free'
    case 'pro':
      return 'Choose Pro'
    case 'premium':
      return 'Choose Premium'
    case 'lifetime':
      return LIFETIME_CTA_AVAILABLE
    default:
      return 'Get started'
  }
}

/** Resolve post-login redirect when `plan` is present without an explicit `next`. */
export function resolveLoginRedirectPath(
  next: string | null | undefined,
  plan: string | null | undefined,
  fallback = '/',
): string {
  const explicit = next?.trim()
  if (explicit) {
    return explicit.startsWith('/') && !explicit.startsWith('//') && !explicit.includes(':')
      ? explicit
      : fallback
  }
  const normalized = normalizePricingPlanId(plan)
  if (normalized && normalized !== 'free') {
    return getCheckoutPath(normalized)
  }
  return fallback
}
