// Panel proxy: pathname header for admin layout + panel host root redirect + API rate limit helper
const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 60
const ipMap = new Map<string, { count: number; start: number }>()

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export default async function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? ''
  const isPanelHost = host === 'panel.espeezy.com' || host.startsWith('panel.')

  if (isPanelHost && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/', '/admin/:path*'],
}
