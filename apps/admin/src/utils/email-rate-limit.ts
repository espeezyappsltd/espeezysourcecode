const EMAIL_SEND_LIMIT = 3
const IP_SEND_LIMIT = 15
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes

const emailRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function trackLimit(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number
) {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: limit - 1 }
  }

  const nextCount = entry.count + 1
  store.set(key, { count: nextCount, resetAt: entry.resetAt })

  return {
    allowed: nextCount <= limit,
    remaining: Math.max(limit - nextCount, 0),
  }
}

export function validateEmailRateLimit(email: string, ip: string) {
  const normalisedEmail = email.trim().toLowerCase()
  const normalisedIp = ip.trim() || 'unknown'

  const ipResult = trackLimit(ipRateLimitMap, normalisedIp, IP_SEND_LIMIT)
  if (!ipResult.allowed) {
    return {
      allowed: false,
      message:
        'Too many account attempts from this network. Please wait a few minutes and try again.',
    }
  }

  const emailResult = trackLimit(emailRateLimitMap, normalisedEmail, EMAIL_SEND_LIMIT)
  if (!emailResult.allowed) {
    return {
      allowed: false,
      message:
        'Too many verification emails have been requested for this address. Please wait a few minutes and try again.',
    }
  }

  return { allowed: true }
}
