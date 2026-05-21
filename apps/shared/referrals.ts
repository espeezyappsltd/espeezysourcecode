import { randomBytes } from 'crypto'
import { REFERRAL_SHARE_PATH } from './referrals-constants'

export {
  REFERRAL_PRO_DISCOUNT_PERCENT,
  REFERRAL_PRO_MAX_REDEMPTIONS,
  REFERRAL_PROMO_HEADLINE,
  REFERRAL_PROMO_TERMS,
  REFERRAL_SHARE_PATH,
} from './referrals-constants'

export function isValidReferralCode(code: unknown): code is string {
  if (typeof code !== 'string') return false
  return /^[A-Z0-9]{8}$/.test(code.trim().toUpperCase())
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase()
}

export function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}

export function buildReferralShareUrl(origin: string, code: string, path = REFERRAL_SHARE_PATH): string {
  const base = origin.replace(/\/$/, '')
  const url = new URL(path, base)
  url.searchParams.set('ref', normalizeReferralCode(code))
  return url.toString()
}
