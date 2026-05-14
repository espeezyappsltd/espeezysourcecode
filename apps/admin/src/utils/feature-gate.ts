import { Profile } from '@/types/database'

export type PlanTier = 'free' | 'pro' | 'premium' | 'lifetime'

export type Feature =
  | 'BREAK_ROOM'
  | 'PROJECT_STATS'
  | 'JUKEBOX'
  | 'ADVANCED_THEMES'
  | 'UNLIMITED_GROUPS'
  | 'ADMIN_ANALYTICS'
  | 'PRIORITY_AI'
  | 'HISTORICAL_ARCHIVING'
  | 'SSL_SHIELDED_ROOMS'
  | 'EARLY_ACCESS_LAB'
  | 'RESEARCHER_API'

const TIER_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
  lifetime: 3,
}

const FEATURE_CONFIG: Record<Feature, PlanTier> = {
  BREAK_ROOM: 'pro',
  PROJECT_STATS: 'pro',
  JUKEBOX: 'pro',
  ADVANCED_THEMES: 'pro',
  UNLIMITED_GROUPS: 'pro',
  HISTORICAL_ARCHIVING: 'pro',
  SSL_SHIELDED_ROOMS: 'pro',
  PRIORITY_AI: 'pro',
  ADMIN_ANALYTICS: 'premium',
  EARLY_ACCESS_LAB: 'premium',
  RESEARCHER_API: 'premium',
}

/**
 * Checks if a user profile has access to a specific feature based on their subscription plan.
 */
export function hasFeature(profile: Profile | null | undefined, feature: Feature): boolean {
  if (!profile) return false

  const userTier = (profile.subscription_plan?.toLowerCase() as PlanTier) || 'free'
  const requiredTier = FEATURE_CONFIG[feature]

  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier]
}

/**
 * Returns the friendly name of the user's current plan.
 */
export function getPlanName(plan: string | null | undefined): string {
  switch (plan?.toLowerCase()) {
    case 'pro':
      return 'Pro Scholar'
    case 'premium':
      return 'Premium Scholar'
    case 'lifetime':
      return 'Lifetime Researcher'
    default:
      return 'Standard'
  }
}

/**
 * Checks if the user is on any paid plan.
 */
export function isPaidUser(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  const userTier = (profile.subscription_plan?.toLowerCase() as PlanTier) || 'free'
  return userTier !== 'free'
}
