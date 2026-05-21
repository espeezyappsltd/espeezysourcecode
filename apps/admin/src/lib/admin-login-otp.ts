import { createHash, randomInt, timingSafeEqual } from 'crypto'
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

export function normalizeStaffEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function maskStaffEmail(email: string): string {
  const normalized = normalizeStaffEmail(email)
  const at = normalized.indexOf('@')
  if (at < 1) return '•••@•••'
  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}•••@${domain}`
}

export function staffEmailHint(member: AdminMember): string | null {
  if (!member.email?.trim()) return null
  return maskStaffEmail(member.email)
}

export function memberRosterEmail(member: AdminMember): string | null {
  if (!member.email?.trim()) return null
  return normalizeStaffEmail(member.email)
}
