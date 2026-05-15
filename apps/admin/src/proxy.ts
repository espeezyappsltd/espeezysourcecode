// Minimal real rateLimit middleware for Next.js API routes
// In production, use Upstash/Redis or a distributed store
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 60
const ipMap = new Map()

import { NextResponse } from 'next/server'

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
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Whoa, you’re going too fast! Please check back in a minute so everyone gets an equal shot.'
      }, { status: 429 })
    }
  }
}

export default async function proxy() {
  // Empty default proxy function to satisfy Next.js requirements if used as a proxy
  return NextResponse.next()
}
