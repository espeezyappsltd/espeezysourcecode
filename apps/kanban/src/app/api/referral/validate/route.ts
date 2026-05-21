import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequestUser } from '@/lib/supabase/admin'
import { getAdminDb } from '@/lib/supabase/admin'
import { resolveReferralProDiscount } from '@/lib/referrals/referral-pro'

export const dynamic = 'force-dynamic'

const schema = z.object({
  referral_code: z.string().trim().max(8),
  plan: z.enum(['pro', 'premium', 'lifetime']).default('pro'),
})

export async function POST(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = getAdminDb()
  if (!adminDb) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 422 })
  }

  const result = await resolveReferralProDiscount(adminDb, {
    buyerUserId: user.id,
    referralCode: parsed.data.referral_code,
    plan: parsed.data.plan,
  })

  if (!result.valid) {
    return NextResponse.json({ valid: false, reason: result.reason }, { status: 200 })
  }

  return NextResponse.json({
    valid: true,
    discount_percent: 30,
    plan: 'pro',
    referral_code: result.normalizedCode,
  })
}
