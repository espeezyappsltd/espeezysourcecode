import { NextResponse } from 'next/server'
import { canAccessFeature, FEATURE_TIERS } from '@/lib/tier-utils'
import type { JwtPayload } from '@/types/jwt'

export const dynamic = 'force-dynamic'

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8')
    return JSON.parse(payload) as JwtPayload
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const feature = searchParams.get('feature') as keyof typeof FEATURE_TIERS | null

  // Get auth token from Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const payload = decodeJwt(token)

  if (!payload || !payload.sub) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userId = payload.sub
  const userEmail = payload.email

  // Get Supabase config
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROJECT_URL ?? '').trim()
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY ?? '').trim()

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 })
  }

  // Get user's tier from profiles table
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=tier`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  }).catch(() => null)

  let tier = 'free'
  if (profileRes?.ok) {
    const profiles = await profileRes.json().catch(() => [])
    if (Array.isArray(profiles) && profiles.length > 0) {
      tier = profiles[0].tier ?? 'free'
    }
  }

  // If no feature requested, return tier info
  if (!feature) {
    return NextResponse.json({
      user_id: userId,
      email: userEmail,
      tier,
    })
  }

  // Check if feature exists
  if (!(feature in FEATURE_TIERS)) {
    return NextResponse.json(
      { error: `Unknown feature: ${feature}` },
      { status: 400 }
    )
  }

  const requiredTier = FEATURE_TIERS[feature]
  const hasAccess = canAccessFeature(tier, requiredTier)

  return NextResponse.json({
    user_id: userId,
    email: userEmail,
    tier,
    feature,
    required_tier: requiredTier,
    has_access: hasAccess,
    ...(hasAccess ? {} : { error: `Requires ${requiredTier} subscription` }),
  }, { status: hasAccess ? 200 : 403 })
}
