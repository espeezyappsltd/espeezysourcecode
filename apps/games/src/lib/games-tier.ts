import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { effectiveProfileTier, normalizeProfileTier } from '@shared/profile-tier'
import { resolveSupabaseEnv } from '@/lib/supabase-env'

export const GAMES_TIER_COOKIE = 'espeezy_games_tier'

export type GamesTier = 'free' | 'pro' | 'premium'

const PAID_TIERS = new Set<GamesTier>(['pro', 'premium'])

export function normalizeGamesTier(value: unknown): GamesTier {
  return normalizeProfileTier(value)
}

/** Paid tier from profile row — max of `tier` and `subscription_plan` (billing source of truth). */
export function tierFromProfileRow(profile: {
  tier?: string | null
  subscription_plan?: string | null
} | null): GamesTier {
  return effectiveProfileTier(profile)
}

export function hasGamesAccess(tier: GamesTier): boolean {
  if (process.env.NODE_ENV === 'development') return true
  return PAID_TIERS.has(tier)
}

/** Read tier from JWT app_metadata (no DB round-trip). */
export function getTierFromJwt(user: User): GamesTier | null {
  const raw = user.app_metadata?.tier
  if (raw === 'pro' || raw === 'premium' || raw === 'free') return raw
  return null
}

export function getTierFromCookie(cookieValue: string | undefined): GamesTier | null {
  if (cookieValue === 'pro' || cookieValue === 'premium' || cookieValue === 'free') {
    return cookieValue
  }
  return null
}

export function tierCookieOptions(maxAgeSeconds = 3600) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

/** Fetch tier from profiles and optionally sync into JWT app_metadata for future requests. */
export async function fetchProfileTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<GamesTier> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, subscription_plan')
    .eq('id', userId)
    .maybeSingle()

  return tierFromProfileRow(
    profile as { tier?: string | null; subscription_plan?: string | null } | null,
  )
}

export async function syncTierToJwt(userId: string, tier: GamesTier): Promise<void> {
  const { url, anonKey } = resolveSupabaseEnv()
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SECRET_KEY ??
    ''
  ).trim()

  if (!url || !serviceKey) return

  try {
    const admin = createAdminClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { tier },
    })
  } catch {
    // Cookie cache still works if JWT sync fails.
  }
}
