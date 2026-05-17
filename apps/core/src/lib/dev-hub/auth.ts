import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const HUB_SESSION_COOKIE = 'espeezy_hub_session'

function hubSecret(): string {
  return process.env.DEV_HUB_SECRET || 'espeezy-local-dev-hub-change-in-production'
}

export function getHubPassword(): string {
  return process.env.DEV_HUB_PASSWORD || 'espeezy'
}

export function signHubSession(): string {
  const payload = `dev-hub:${Date.now()}`
  const sig = createHmac('sha256', hubSecret()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyHubSession(token: string | undefined | null): boolean {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const expected = createHmac('sha256', hubSecret()).update(payload).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function isHubAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  return verifyHubSession(jar.get(HUB_SESSION_COOKIE)?.value)
}

export function assertDevEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev hub is disabled in production builds.')
  }
}
