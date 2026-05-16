import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { canAccessFeature, FEATURE_TIERS } from '@/lib/tier-utils'
import type { JwtPayload } from '@/types/jwt'
import { CACHE_HEADERS, getCached } from '@/utils/server-cache'

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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const payload = decodeJwt(token)

  if (!payload?.sub) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userId = payload.sub
  const userEmail = payload.email

  const tier = await getCached(`auth:tier:${userId}`, 30_000, async () => {
    const adminDb = getAdminDb()
    const { data } = await adminDb
      .from('profiles')
      .select('tier, subscription_plan')
      .eq('id', userId)
      .maybeSingle()

    return data?.tier ?? data?.subscription_plan ?? 'free'
  })

  if (!feature) {
    return NextResponse.json(
      { user_id: userId, email: userEmail, tier },
      { headers: CACHE_HEADERS.private },
    )
  }

  if (!(feature in FEATURE_TIERS)) {
    return NextResponse.json({ error: `Unknown feature: ${feature}` }, { status: 400 })
  }

  const requiredTier = FEATURE_TIERS[feature]
  const hasAccess = canAccessFeature(tier, requiredTier)

  return NextResponse.json(
    {
      user_id: userId,
      email: userEmail,
      tier,
      feature,
      required_tier: requiredTier,
      has_access: hasAccess,
      ...(hasAccess ? {} : { error: `Requires ${requiredTier} subscription` }),
    },
    { status: hasAccess ? 200 : 403, headers: CACHE_HEADERS.private },
  )
}
