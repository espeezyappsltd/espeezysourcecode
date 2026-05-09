/**
 * Get the current user's subscription tier from Supabase profiles
 */
export async function getUserTier(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
): Promise<'free' | 'pro' | 'premium' | null> {
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=tier`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  }).catch(() => null)

  if (!res || !res.ok) return null

  const data = await res.json().catch(() => null)
  if (!Array.isArray(data) || data.length === 0) return null
  return data[0].tier as 'free' | 'pro' | 'premium'
}

/**
 * Check if a user has access to a feature based on tier
 */
export function canAccessFeature(
  tier: string | null,
  requiredTier: 'free' | 'pro' | 'premium',
): boolean {
  const tierHierarchy: Record<string, number> = {
    free: 0,
    pro: 1,
    premium: 2,
  }

  const userLevel = tierHierarchy[tier ?? 'free'] ?? 0
  const requiredLevel = tierHierarchy[requiredTier] ?? 0

  return userLevel >= requiredLevel
}

/**
 * Feature tier requirements
 */
export const FEATURE_TIERS = {
  GAMES: 'pro' as const,
  KANBAN: 'pro' as const,
  CHAT: 'free' as const,
} as const
