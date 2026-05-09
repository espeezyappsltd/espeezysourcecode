import { randomBytes } from 'crypto'

export function isSupabaseUserExistsError(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const data = payload as Record<string, unknown>
  const code = typeof data.code === 'string' ? data.code.toLowerCase() : ''
  const message = typeof data.message === 'string' ? data.message.toLowerCase() : ''
  return code === 'user_already_exists' || message.includes('already') || message.includes('registered')
}

export function generateServicePassword(length = 24): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*()-_=+[]{}'
  const all = `${lowercase}${uppercase}${numbers}${special}`
  const chars = [
    lowercase[randomBytes(1)[0] % lowercase.length],
    uppercase[randomBytes(1)[0] % uppercase.length],
    numbers[randomBytes(1)[0] % numbers.length],
    special[randomBytes(1)[0] % special.length],
  ]
  const targetLength = Math.max(length, 12)
  while (chars.length < targetLength) {
    chars.push(all[randomBytes(1)[0] % all.length])
  }
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
