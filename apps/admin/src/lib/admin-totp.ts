import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'

/** Shown in Microsoft Authenticator as the account issuer (standard TOTP / RFC 6238). */
export const ADMIN_TOTP_ISSUER = 'Espeezy Panel'
export const MS_AUTHENTICATOR_APP_NAME = 'Microsoft Authenticator'
export const ADMIN_TOTP_STEP_SEC = 30
export const ADMIN_TOTP_DIGITS = 6
export const ADMIN_TOTP_MAX_VERIFY_ATTEMPTS = 8
export const ADMIN_TOTP_LOCKOUT_MS = 15 * 60 * 1000
/** ±2 steps (±60s) — helps phones with clock drift (common on Microsoft Authenticator). */
export const ADMIN_TOTP_WINDOW = 2

export const MS_AUTHENTICATOR_ENROLL_STEPS = [
  'Install Microsoft Authenticator (iOS or Android).',
  'Tap + → Other account (work/school style account — not your personal Microsoft login).',
  'Scan the QR from npm run seed:admin-totp, or enter the secret key manually.',
  'Confirm Type: Time based, Digits: 6, Period: 30 seconds, Algorithm: SHA-1.',
  'At panel login, open Microsoft Authenticator and use the 6-digit code for Espeezy Panel.',
] as const

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function encryptionKey(): Buffer {
  const raw =
    process.env.ADMIN_TOTP_ENCRYPTION_KEY ??
    process.env.ADMIN_OTP_PEPPER ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_TOTP_ENCRYPTION_KEY (or ADMIN_OTP_PEPPER) is required in production')
    }
    return createHash('sha256').update('dev-admin-totp-key').digest()
  }
  return createHash('sha256').update(raw).digest()
}

export function generateTotpSecretBase32(): string {
  return base32Encode(randomBytes(20))
}

function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }
  return output
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.replace(/=+$/g, '').toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function hotp(secret: Buffer, counter: bigint): string {
  const counterBuf = Buffer.alloc(8)
  counterBuf.writeBigUInt64BE(counter)
  const hmac = createHmac('sha1', secret).update(counterBuf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(binary % 10 ** ADMIN_TOTP_DIGITS).padStart(ADMIN_TOTP_DIGITS, '0')
}

export function generateTotpCode(secretBase32: string, timeMs = Date.now()): string {
  const counter = BigInt(Math.floor(timeMs / 1000 / ADMIN_TOTP_STEP_SEC))
  return hotp(base32Decode(secretBase32), counter)
}

export function verifyTotpToken(secretBase32: string, token: string, window = ADMIN_TOTP_WINDOW): boolean {
  const clean = token.replace(/\D/g, '').slice(0, ADMIN_TOTP_DIGITS)
  if (clean.length !== ADMIN_TOTP_DIGITS) return false
  const now = Date.now()
  for (let w = -window; w <= window; w++) {
    const at = now + w * ADMIN_TOTP_STEP_SEC * 1000
    const expected = generateTotpCode(secretBase32, at)
    try {
      if (timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return true
    } catch {
      continue
    }
  }
  return false
}

/**
 * otpauth URI tuned for Microsoft Authenticator QR scan + manual entry.
 * @see https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-oath-tokens
 */
export function buildOtpAuthUri(username: string, secretBase32: string): string {
  const secret = secretBase32.replace(/\s/g, '').toUpperCase()
  const label = encodeURIComponent(`${ADMIN_TOTP_ISSUER} (${username})`)
  const issuer = encodeURIComponent(ADMIN_TOTP_ISSUER)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${ADMIN_TOTP_DIGITS}&period=${ADMIN_TOTP_STEP_SEC}`
}

export function buildMicrosoftAuthenticatorQrUrl(otpauthUri: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(otpauthUri)}`
}

export type MicrosoftAuthenticatorEnrollment = {
  username: string
  accountLabel: string
  secretBase32: string
  otpauthUri: string
  qrImageUrl: string
  manualEntry: {
    accountName: string
    secretKey: string
    type: 'Time based'
    digits: number
    periodSeconds: number
    algorithm: 'SHA-1'
  }
}

export function buildMicrosoftAuthenticatorEnrollment(
  username: string,
  secretBase32: string,
): MicrosoftAuthenticatorEnrollment {
  const secret = secretBase32.replace(/\s/g, '').toUpperCase()
  const otpauthUri = buildOtpAuthUri(username, secret)
  return {
    username,
    accountLabel: `${ADMIN_TOTP_ISSUER} (${username})`,
    secretBase32: secret,
    otpauthUri,
    qrImageUrl: buildMicrosoftAuthenticatorQrUrl(otpauthUri),
    manualEntry: {
      accountName: `${ADMIN_TOTP_ISSUER} (${username})`,
      secretKey: secret,
      type: 'Time based',
      digits: ADMIN_TOTP_DIGITS,
      periodSeconds: ADMIN_TOTP_STEP_SEC,
      algorithm: 'SHA-1',
    },
  }
}

export function encryptTotpSecret(secretBase32: string): string {
  const key = encryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(secretBase32, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`
}

export function decryptTotpSecret(payload: string): string | null {
  try {
    const [ivB64, tagB64, dataB64] = payload.split('.')
    if (!ivB64 || !tagB64 || !dataB64) return null
    const key = encryptionKey()
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ])
    return plain.toString('utf8')
  } catch {
    return null
  }
}

export type TotpMemberFields = {
  totp_secret_enc?: string | null
  totp_enrolled_at?: string | null
  totp_verify_attempts?: number | null
  totp_locked_until?: string | null
}

export function memberHasTotpEnrolled(member: TotpMemberFields): boolean {
  return Boolean(member.totp_secret_enc?.trim() && member.totp_enrolled_at)
}

export function isTotpLocked(member: TotpMemberFields): boolean {
  if (!member.totp_locked_until) return false
  return new Date(member.totp_locked_until).getTime() > Date.now()
}

export function isAdminTotpDevBypass(code: string): boolean {
  if (process.env.NODE_ENV === 'production') return false
  if (process.env.ADMIN_TOTP_DEV_BYPASS === 'true') return true
  return code.replace(/\D/g, '') === '000000'
}

export function isPanelTotpDevMode(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ADMIN_TOTP_DEV_BYPASS === 'true'
}
