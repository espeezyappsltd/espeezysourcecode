import { NextResponse } from 'next/server'

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 60
const ipMap = new Map<string, { count: number; start: number }>()

export async function rateLimit(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  let entry = ipMap.get(ip)
  if (!entry || now - entry.start > WINDOW_MS) {
    entry = { count: 1, start: now }
    ipMap.set(ip, entry)
  } else {
    entry.count++
    if (entry.count > MAX_REQUESTS) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            'Whoa, you’re going too fast! Please check back in a minute so everyone gets an equal shot.',
        },
        { status: 429 },
      )
    }
  }
}
