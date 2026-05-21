import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'
import type { AdminMember } from '@/lib/admin-rbac'

export const ADMIN_OTP_TTL_MS = 10 * 60 * 1000
export const ADMIN_OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000
export const ADMIN_OTP_MAX_REQUESTS_PER_WINDOW = 5
export const ADMIN_OTP_MAX_VERIFY_ATTEMPTS = 5

function otpPepper(): string {
  const pepper = process.env.ADMIN_OTP_PEPPER ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!pepper) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_OTP_PEPPER or SUPABASE_SERVICE_ROLE_KEY is required in production')
    }
    return 'dev-admin-otp-pepper'
  }
  return pepper
}

export function hashAdminOtpCode(code: string): string {
  return createHash('sha256').update(`${code}:${otpPepper()}`).digest('hex')
}

export function generateAdminOtpCode(): string {
  return String(randomInt(100_000, 1_000_000))
}

export function verifyAdminOtpCode(code: string, storedHash: string): boolean {
  const computed = hashAdminOtpCode(code.replace(/\D/g, '').slice(0, 6))
  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash))
  } catch {
    return false
  }
}

export function normalizeStaffPhone(input: string, defaultCountry: CountryCode = 'US'): string | null {
  const raw = input.trim()
  if (!raw) return null
  try {
    const parsed = raw.startsWith('+')
      ? parsePhoneNumber(raw)
      : parsePhoneNumber(raw, defaultCountry)
    if (!parsed?.isValid()) return null
    return parsed.format('E.164')
  } catch {
    return null
  }
}

export function staffPhoneMatches(member: AdminMember, enteredPhone: string): boolean {
  const stored = member.phone ? normalizeStaffPhone(member.phone) : null
  const entered = normalizeStaffPhone(enteredPhone)
  if (!stored || !entered) return false
  return stored === entered
}

export function maskStaffPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '')
  if (digits.length < 4) return '••••'
  return `••••${digits.slice(-4)}`
}

export function staffPhoneHint(member: AdminMember): string | null {
  if (!member.phone) return null
  const e164 = normalizeStaffPhone(member.phone)
  return e164 ? maskStaffPhone(e164) : null
}
