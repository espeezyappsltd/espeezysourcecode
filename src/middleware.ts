import { type NextRequest, NextResponse } from 'next/server'
// ─── NEXT.JS MIDDLEWARE (OFFICIAL) ───────────────────────────────────────────
// This replaces the custom server.js logic for Vercel portability.
// It handles security headers, distributed rate limiting, and request filtering.
//
// ─── DISTRIBUTED RATE LIMITING ────────────────────────────────────────────────
// Uses Upstash Redis sliding-window when UPSTASH_REDIS_REST_URL is configured
// (production / all Vercel regions). Falls back to in-process buckets for local dev.
// Upstash Redis is globally replicated — rate limits are consistent across all
// Vercel edge regions simultaneously.

interface RateBucket { count: number; resetAt: number }
const _localBuckets = new Map<string, RateBucket>()

async function checkRateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number; retryAfter: number }> {
  const redisUrl  = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    // ── Upstash sliding-window via REST API (edge-compatible, no Node.js SDK) ──
    const now   = Math.floor(Date.now() / 1000)
    const slot  = Math.floor(now / windowSecs)
    const rKey  = `rl:${key}:${slot}`
    const resetAt = (slot + 1) * windowSecs

    const res = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', rKey],
        ['EXPIRE', rKey, windowSecs + 5],
      ]),
    }).catch(() => null)

    if (res?.ok) {
      const [[, count]] = (await res.json()) as [[string, number]]
      const remaining = Math.max(limit - count, 0)
      return {
        allowed: count <= limit,
        remaining,
        resetAt: resetAt * 1000,
        retryAfter: resetAt - now,
      }
    }
    // Redis unavailable — fail open (don't block real users if Redis is down)
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSecs * 1000, retryAfter: windowSecs }
  }

  // ── In-process fallback (local dev / single instance) ──────────────────────
  const now = Date.now()
  const entry = _localBuckets.get(key)
  if (!entry || now > entry.resetAt) {
    _localBuckets.set(key, { count: 1, resetAt: now + windowSecs * 1000 })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowSecs * 1000, retryAfter: windowSecs }
  }
  entry.count++
  const remaining = Math.max(limit - entry.count, 0)
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
  return { allowed: entry.count <= limit, remaining, resetAt: entry.resetAt, retryAfter }
}

// ─── CSP NONCE-FREE POLICY ────────────────────────────────────────────────────
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-insights.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.githubusercontent.com https://lh3.googleusercontent.com https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.openai.com https://api.stripe.com https://*.vercel-insights.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.firebaseio.com https://*.googleapis.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

// ─── REDIRECT PARAM CONSTANTS ─────────────────────────────────────────────────
const REDIRECT_PARAMS   = ['next', 'redirect', 'redirectTo', 'to', 'returnTo', 'url', 'return']
const SENSITIVE_PREFIXES = ['/login', '/auth', '/api/auth']

export default async function middleware(request: NextRequest) {
  const ip = (request.headers.get('x-forwarded-for') ?? 'anonymous').split(',')[0].trim()
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV === 'development'
  const hostHeader = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(':')[0].toLowerCase()

  const canonicalHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://espeezy.com').host.toLowerCase()
    } catch {
      return 'espeezy.com'
    }
  })()

  if (!isDev && hostHeader && hostHeader === `www.${canonicalHost}`) {
    const target = request.nextUrl.clone()
    target.protocol = 'https:'
    target.host = canonicalHost
    return NextResponse.redirect(target, 308)
  }

  // ── 1. Block TRACE/TRACK ──────────────────────────────────────────────────
  if (request.method === 'TRACE' || request.method === 'TRACK') {
    return new NextResponse('Method Not Allowed', { status: 405 })
  }

  // ── 2. Strip open-redirect params BEFORE rate limiting ───────────────────
  if (SENSITIVE_PREFIXES.some(p => pathname.startsWith(p))) {
    const cloned = request.nextUrl.clone()
    let stripped = false
    for (const param of REDIRECT_PARAMS) {
      const val = cloned.searchParams.get(param)
      if (val && (/^https?:/i.test(val) || val.startsWith('//') || /^javascript:/i.test(val))) {
        cloned.searchParams.delete(param)
        stripped = true
      }
    }
    if (stripped) return NextResponse.redirect(cloned)
  }

  // ── 3. Distributed rate limiting (production only) ───────────────────────
  if (!isDev) {
    let tier: { key: string; limit: number; window: number; label: string }

    if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
      tier = { key: `admin:${ip}`, limit: 30, window: 60, label: 'admin' }
    } else if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth') || pathname.startsWith('/login')) {
      tier = { key: `auth:${ip}`, limit: 20, window: 60, label: 'auth' }
    } else if (pathname.startsWith('/api')) {
      tier = { key: `api:${ip}`, limit: 120, window: 60, label: 'api' }
    } else {
      tier = { key: `global:${ip}`, limit: 600, window: 60, label: 'global' }
    }

    const rl = await checkRateLimit(tier.key, tier.limit, tier.window)
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': rl.retryAfter.toString(),
          'X-RateLimit-Limit': tier.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(rl.resetAt / 1000).toString(),
        },
      })
    }
  }

  // ── 4. Block oversized bodies ─────────────────────────────────────────────
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10)
  if (contentLength > 500_000) {
    return new NextResponse('Payload Too Large', { status: 413 })
  }

  // ── 5. Protect admin & terminal pages ────────────────────────────────────
  if (pathname.startsWith('/terminal') || pathname.startsWith('/admin')) {
    const firebaseSession = request.cookies.get('__session')
    if (!firebaseSession) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── 6. Supabase session refresh (fail-open for public availability) ──────
  // If Supabase/session refresh fails, keep public pages online so marketing
  // and business-verification crawlers can still access the site.
  let response: NextResponse = NextResponse.next({ request })

  // ── 7. Security + performance headers ────────────────────────────────────
  response.headers.set('Content-Security-Policy', CSP)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', pathname.startsWith('/api') ? 'DENY' : 'SAMEORIGIN')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.delete('X-Powered-By')

  // Cache public pages at the edge (CDN) — revalidated every 60s, stale up to 5min
  if (!pathname.startsWith('/api') && !pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/admin') && request.method === 'GET') {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|favicon.png|\\.well-known/workflow/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

