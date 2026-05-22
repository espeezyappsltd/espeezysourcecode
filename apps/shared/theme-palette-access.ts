export type ThemePlanTier = 'free' | 'pro' | 'premium' | 'lifetime'

const TIER_RANK: Record<ThemePlanTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
  lifetime: 3,
}

function planTier(plan: string | null | undefined): ThemePlanTier {
  const raw = (plan ?? 'free').toLowerCase()
  if (raw === 'premium' || raw === 'lifetime') return raw === 'lifetime' ? 'lifetime' : 'premium'
  if (raw === 'pro') return 'pro'
  return 'free'
}

/** Matches Kanban feature-gate palette access for cross-app theme settings. */
export function canAccessPaletteTier(
  subscriptionPlan: string | null | undefined,
  paletteTier: 'free' | 'pro' | 'premium' | undefined,
): boolean {
  const tier = paletteTier ?? 'free'
  const user = planTier(subscriptionPlan)
  if (tier === 'free') return true
  if (tier === 'pro') return TIER_RANK[user] >= TIER_RANK.pro
  if (tier === 'premium') return TIER_RANK[user] >= TIER_RANK.premium
  return false
}
