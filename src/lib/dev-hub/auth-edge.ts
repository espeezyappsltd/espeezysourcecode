/**
 * Edge-safe dev-hub session helpers (no node:crypto — used by middleware).
 */
export const HUB_SESSION_COOKIE = 'espeezy_hub_session'

function hubSecret(): string {
  return process.env.DEV_HUB_SECRET || 'espeezy-local-dev-hub-change-in-production'
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyHubSessionEdge(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const expected = await hmacSha256Hex(hubSecret(), payload)
  if (sig.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}
