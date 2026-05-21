/**
 * Effective subscription tier from profiles — uses the higher of `tier` and `subscription_plan`
 * so Stripe/Kanban billing (`subscription_plan`) is not overridden by a stale default `tier`.
 */
export type ProfileSubscriptionTier = 'free' | 'pro' | 'premium'

export function normalizeProfileTier(value: unknown): ProfileSubscriptionTier {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (raw === 'premium' || raw === 'lifetime') return 'premium'
  if (raw === 'pro') return 'pro'
  return 'free'
}

export function effectiveProfileTier(profile: {
  tier?: string | null
  subscription_plan?: string | null
} | null): ProfileSubscriptionTier {
  if (!profile) return 'free'
  const fromTier = normalizeProfileTier(profile.tier)
  const fromPlan = normalizeProfileTier(profile.subscription_plan)
  if (fromTier === 'premium' || fromPlan === 'premium') return 'premium'
  if (fromTier === 'pro' || fromPlan === 'pro') return 'pro'
  return 'free'
}
