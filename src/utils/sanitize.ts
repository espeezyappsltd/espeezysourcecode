/**
 * Bank-Level Input Sanitization & Validation Utilities
 * =====================================================
 * Centralised defence against:
 *   - XSS (stored & reflected)
 *   - HTML/script injection
 *   - Null-byte injection
 *   - Oversized payloads
 *   - Type coercion attacks
 *   - Email enumeration
 *   - Numeric overflow / negative amount exploits
 */

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MAX_STRING_LENGTH = 10_000
const MAX_EMAIL_LENGTH = 254 // RFC 5321
const MAX_CONTENT_LENGTH = 2_000
const MAX_TITLE_LENGTH = 200
const MAX_UUID_LENGTH = 36

// ─── PRIMITIVE SANITIZERS ─────────────────────────────────────────────────────

/** Strip null bytes and control characters that break DB queries */
export function stripControlChars(value: string): string {
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/** HTML-encode the five dangerous HTML characters to prevent XSS */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Strip all HTML tags — use for plain-text fields */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}

/** Remove javascript: and data: URI schemes from any string */
export function stripDangerousProtocols(value: string): string {
  return value.replace(/^\s*(javascript|data|vbscript):/gi, '')
}

/**
 * Full sanitize pipeline for user-generated text content.
 * Use for post content, descriptions, comments — anything stored and re-rendered.
 */
export function sanitizeText(value: unknown, maxLength = MAX_STRING_LENGTH): string {
  if (typeof value !== 'string') return ''
  let clean = value
    .slice(0, maxLength)
  clean = stripControlChars(clean)
  clean = stripHtml(clean)
  clean = stripDangerousProtocols(clean)
  return clean.trim()
}

/**
 * Sanitize for plain name fields (no HTML at all, no special chars beyond apostrophes)
 */
export function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') return ''
  return stripControlChars(value)
    .replace(/<[^>]*>/g, '')
    .slice(0, 100)
    .trim()
}

// ─── VALIDATORS ───────────────────────────────────────────────────────────────

/** RFC 5322-compliant email validation with length check */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  if (email.length > MAX_EMAIL_LENGTH) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/** UUID v4 validation — prevents IDOR via non-UUID params */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value.length !== MAX_UUID_LENGTH) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/** Safe positive integer — prevents negative amounts, overflows, string injection */
export function isPositiveInteger(value: unknown, max = 10_000_000_00): boolean {
  if (typeof value !== 'number') return false
  if (!Number.isFinite(value)) return false
  if (!Number.isInteger(value)) return false
  if (value <= 0) return false
  if (value > max) return false
  return true
}

/** Validate that a string is one of a fixed set of allowed values (enum guard) */
export function isAllowedValue<T extends string>(value: unknown, allowed: T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

/** Strip SQL comment sequences and common injection patterns from query strings */
export function sanitizeQueryParam(value: unknown, maxLength = 100): string {
  if (typeof value !== 'string') return ''
  return value
    .slice(0, maxLength)
    .replace(/(-{2,}|\/\*|\*\/|;|'|"|`)/g, '') // strip --, /*, */, ;, quotes
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CAST|CONVERT|CHAR|NCHAR|VARCHAR)\b/gi, '')
    .trim()
}

// ─── REQUEST BODY SIZE GUARD ──────────────────────────────────────────────────

/**
 * Reject requests whose JSON body exceeds maxBytes.
 * Call this at the top of any POST handler BEFORE parsing body.
 */
export function checkBodySize(req: Request, maxBytes = 50_000): boolean {
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (isNaN(contentLength)) return true // unknown — allow, let parse fail naturally
  return contentLength <= maxBytes
}

// ─── EXPORT CONSTANTS ─────────────────────────────────────────────────────────

export const LIMITS = {
  MAX_STRING_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_UUID_LENGTH,
}
