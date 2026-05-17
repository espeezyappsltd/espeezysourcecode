import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest, NextResponse } from 'next/server'
import {
  fetchProfileTier,
  getTierFromCookie,
  getTierFromJwt,
  GAMES_TIER_COOKIE,
  normalizeGamesTier,
  syncTierToJwt,
  tierCookieOptions,
  type GamesTier,
} from '@/lib/games-tier'

export type ResolveTierResult = {
  tier: GamesTier
  source: 'jwt' | 'cookie' | 'database'
}

/**
 * Resolve games access tier: JWT app_metadata first, then httpOnly cookie, then one DB read.
 */
export async function resolveGamesTier(
  user: User,
  request: NextRequest,
  supabase: SupabaseClient,
): Promise<ResolveTierResult> {
  const jwtTier = getTierFromJwt(user)
  if (jwtTier) {
    return { tier: jwtTier, source: 'jwt' }
  }

  const cookieTier = getTierFromCookie(request.cookies.get(GAMES_TIER_COOKIE)?.value)
  if (cookieTier) {
    return { tier: cookieTier, source: 'cookie' }
  }

  const tier = await fetchProfileTier(supabase, user.id)
  void syncTierToJwt(user.id, tier)
  return { tier, source: 'database' }
}

export function attachTierCacheCookie(response: NextResponse, tier: GamesTier): void {
  response.cookies.set(GAMES_TIER_COOKIE, tier, tierCookieOptions())
}
