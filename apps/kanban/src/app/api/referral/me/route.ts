import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { getAdminDb } from '@/lib/supabase/admin'
import { ensureProfileReferralCode } from '@/lib/referrals/referral-pro'
import {
  REFERRAL_PRO_MAX_REDEMPTIONS,
  REFERRAL_PROMO_TERMS,
  buildReferralShareUrl,
} from '@shared/referrals'
import { resolveRequestOrigin } from '@shared/app-url'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = getAdminDb()
  if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

  try {
    const { referral_code, referral_pro_redemptions_count } = await ensureProfileReferralCode(
      adminDb,
      user.id,
      user.email,
    )

    const redemptionsUsed = referral_pro_redemptions_count ?? 0
    const redemptionsRemaining = Math.max(0, REFERRAL_PRO_MAX_REDEMPTIONS - redemptionsUsed)
    const origin = resolveRequestOrigin(req)

    return NextResponse.json({
      referral_code,
      redemptions_used: redemptionsUsed,
      redemptions_remaining: redemptionsRemaining,
      max_redemptions: REFERRAL_PRO_MAX_REDEMPTIONS,
      share_url: buildReferralShareUrl(origin, referral_code),
      terms: REFERRAL_PROMO_TERMS,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load referral'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
