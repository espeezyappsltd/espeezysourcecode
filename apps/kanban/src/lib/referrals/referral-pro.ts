import type { SupabaseClient } from '@supabase/supabase-js'
import {
  REFERRAL_PRO_MAX_REDEMPTIONS,
  generateReferralCode,
  isValidReferralCode,
  normalizeReferralCode,
} from '@shared/referrals'
import type { CheckoutPlanKey } from '@/lib/stripe/create-checkout-session'

export type ReferralProDiscountResult =
  | {
      valid: true
      couponId: string
      referrerProfileId: string
      normalizedCode: string
    }
  | { valid: false; reason: string }

export function getReferralProCouponId(): string | null {
  return process.env.STRIPE_REFERRAL_PRO_COUPON_ID?.trim() || null
}

export async function ensureProfileReferralCode(
  adminDb: SupabaseClient,
  userId: string,
  email: string | null | undefined,
): Promise<{ referral_code: string; referral_pro_redemptions_count: number }> {
  const { data: profile } = await adminDb
    .from('profiles')
    .select('referral_code, referral_pro_redemptions_count')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.referral_code) {
    return {
      referral_code: profile.referral_code,
      referral_pro_redemptions_count: profile.referral_pro_redemptions_count ?? 0,
    }
  }

  let code: string | null = null
  if (email) {
    const { data: pre } = await adminDb
      .from('pre_registrations')
      .select('referral_code')
      .eq('email', email)
      .maybeSingle()
    if (pre?.referral_code && isValidReferralCode(pre.referral_code)) {
      code = normalizeReferralCode(pre.referral_code)
    }
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = code ?? generateReferralCode()
    const { error } = await adminDb
      .from('profiles')
      .update({ referral_code: candidate, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (!error) {
      return {
        referral_code: candidate,
        referral_pro_redemptions_count: profile?.referral_pro_redemptions_count ?? 0,
      }
    }

    if (error.code === '23505') {
      code = null
      continue
    }
    throw error
  }

  throw new Error('Unable to assign referral code')
}

export async function resolveReferralProDiscount(
  adminDb: SupabaseClient,
  input: {
    buyerUserId: string
    referralCode: string | null | undefined
    plan: CheckoutPlanKey
  },
): Promise<ReferralProDiscountResult> {
  if (input.plan !== 'pro') {
    return { valid: false, reason: 'Referral discount applies to Pro only.' }
  }

  const couponId = getReferralProCouponId()
  if (!couponId) {
    return { valid: false, reason: 'Referral discount is not configured.' }
  }

  if (!input.referralCode || !isValidReferralCode(input.referralCode)) {
    return { valid: false, reason: 'Enter a valid 8-character referral code.' }
  }

  const normalizedCode = normalizeReferralCode(input.referralCode)

  const { data: referrer } = await adminDb
    .from('profiles')
    .select('id, referral_pro_redemptions_count')
    .eq('referral_code', normalizedCode)
    .maybeSingle()

  if (!referrer?.id) {
    return { valid: false, reason: 'Referral code not found.' }
  }

  if (referrer.id === input.buyerUserId) {
    return { valid: false, reason: 'You cannot use your own referral code.' }
  }

  if ((referrer.referral_pro_redemptions_count ?? 0) >= REFERRAL_PRO_MAX_REDEMPTIONS) {
    return {
      valid: false,
      reason: `This code has reached the maximum of ${REFERRAL_PRO_MAX_REDEMPTIONS} Pro discounts.`,
    }
  }

  const { data: prior } = await adminDb
    .from('referral_pro_redemptions')
    .select('id')
    .eq('referred_profile_id', input.buyerUserId)
    .maybeSingle()

  if (prior?.id) {
    return { valid: false, reason: 'You have already used a referral discount on Pro.' }
  }

  return {
    valid: true,
    couponId,
    referrerProfileId: referrer.id,
    normalizedCode,
  }
}

export async function attachReferrerToProfile(
  adminDb: SupabaseClient,
  userId: string,
  referralCode: string | null | undefined,
): Promise<{ ok: boolean; reason?: string }> {
  if (!referralCode || !isValidReferralCode(referralCode)) {
    return { ok: false, reason: 'Invalid referral code' }
  }

  const normalized = normalizeReferralCode(referralCode)

  const { data: self } = await adminDb
    .from('profiles')
    .select('referred_by_profile_id, referral_code')
    .eq('id', userId)
    .maybeSingle()

  if (self?.referred_by_profile_id) {
    return { ok: true }
  }

  if (self?.referral_code === normalized) {
    return { ok: false, reason: 'Cannot refer yourself' }
  }

  const { data: referrer } = await adminDb
    .from('profiles')
    .select('id')
    .eq('referral_code', normalized)
    .maybeSingle()

  if (!referrer?.id || referrer.id === userId) {
    return { ok: false, reason: 'Referral code not found' }
  }

  const { error } = await adminDb
    .from('profiles')
    .update({
      referred_by_profile_id: referrer.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

export async function recordReferralProRedemption(
  adminDb: SupabaseClient,
  referrerProfileId: string,
  referredProfileId: string,
  stripeCheckoutSessionId: string,
): Promise<boolean> {
  const { data, error } = await adminDb.rpc('record_referral_pro_redemption', {
    p_referrer_id: referrerProfileId,
    p_referred_id: referredProfileId,
    p_session_id: stripeCheckoutSessionId,
  })

  if (error) {
    console.error('[referral] record redemption:', error.message)
    return false
  }

  return data === true
}
