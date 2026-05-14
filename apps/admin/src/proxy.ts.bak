import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
// ─── NEXT.JS MIDDLEWARE (OFFICIAL) ───────────────────────────────────────────
// This replaces the custom server.js logic for Vercel portability.
// It handles security headers, distributed rate limiting, and request filtering.
//
// ─── DISTRIBUTED RATE LIMITING ────────────────────────────────────────────────
// Uses Upstash Redis sliding-window when UPSTASH_REDIS_REST_URL is configured
// (production / all Vercel regions). Falls back to in-process buckets for local dev.
// Upstash Redis is globally replicated  -  rate limits are consistent across all
// Vercel edge regions simultaneously.

interface RateBucket { count: number; resetAt: number }
const _localBuckets = new Map<string, RateBucket>()

async function checkRateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number; retryAfter: number }> {
  const firebaseKey = process.env.FIREBASE_DATABASE_URL // Should be the REST URL e.g. https://project.firebaseio.com

  const now = Math.floor(Date.now() / 1000)
  const slot = Math.floor(now / windowSecs)
  const rKey = `rl/${key.replace(/[:.]/g, '_')}/${slot}`
  const resetAt = (slot + 1) * windowSecs

  // ── Hybrid: Local burst check to save on DB hits ──
  const local = _localBuckets.get(rKey)
  if (local && local.count > limit) {
    return { allowed: false, remaining: 0, resetAt: resetAt * 1000, retryAfter: resetAt - now }
  }

  if (firebaseKey) {
    try {
      const url = `${firebaseKey}/${rKey}.json`
      // Atomic increment via RTDB REST API
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: { ".sv": { "increment": 1 } }, last_updated: { ".sv": "timestamp" } }),
      })

      if (res.ok) {
        const data = await res.json()
        const count = data.count || 0
        
        // Update local cache
        _localBuckets.set(rKey, { count, resetAt: resetAt * 1000 })
        
        // Cleanup old local buckets periodically
        if (_localBuckets.size > 1000) _localBuckets.clear()

        return {
          allowed: count <= limit,
          remaining: Math.max(limit - count, 0),
          resetAt: resetAt * 1000,
          retryAfter: resetAt - now,
        }
      }
    } catch (err) {
      console.error('Rate limit DB error:', err)
    }
  }

  // ── Fallback to local memory (fail-open or local dev) ──
  const entry = _localBuckets.get(rKey) || { count: 0, resetAt: resetAt * 1000 }
  entry.count++
  _localBuckets.set(rKey, entry)
  
  return { 
    allowed: entry.count <= limit, 
    remaining: Math.max(limit - entry.count, 0), 
    resetAt: resetAt * 1000, 
    retryAfter: resetAt - now 
  }
}

// ─── CSP NONCE-FREE POLICY ────────────────────────────────────────────────────
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-insights.com https://va.vercel-scripts.com https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.githubusercontent.com https://lh3.googleusercontent.com https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.openai.com https://api.stripe.com https://*.vercel-insights.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.firebaseio.com https://*.firebasedatabase.app wss://*.firebaseio.com wss://*.firebasedatabase.app https://*.googleapis.com wss://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  "frame-src 'self' https://*.firebaseio.com https://*.firebasedatabase.app https://vercel.live",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

// ─── REDIRECT PARAM CONSTANTS ─────────────────────────────────────────────────
const REDIRECT_PARAMS   = ['next', 'redirect', 'redirectTo', 'to', 'returnTo', 'url', 'return']
const SENSITIVE_PREFIXES = ['/login', '/auth', '/api/auth']

export default async function proxy(request: NextRequest) {
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

  // ── 0. Vercel-only: serve ONLY the preregister surface ───────────────────
  // On Vercel (VERCEL=1), every route outside of preregister + static assets
  // returns 404. The VPS (where VERCEL is unset) is unaffected.
  // Legal/public pages are always allowed regardless of environment.
  if (process.env.VERCEL) {
    const ALLOWED = ['/', '/preregister', '/api/preregister', '/terms', '/privacy', '/contact', '/docs', '/fund']
    const isAllowed =
      ALLOWED.includes(pathname) ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/preregister') ||
      pathname.startsWith('/docs/')
    if (!isAllowed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
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

  // ── 2b. Route signup entrypoint to preregistration ───────────────────────
  if (pathname === '/login' && request.nextUrl.searchParams.get('signup') === 'true') {
    const target = new URL('/preregister', request.url)
    return NextResponse.redirect(target)
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
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      let supabaseResponse = NextResponse.next({ request })
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) => {
                supabaseResponse.cookies.set(name, value, options)
              })
            },
          },
        }
      )
      await supabase.auth.getUser()
    } catch {
      // no-op: keep site available if auth backend is unavailable
    }
  }

  const response = NextResponse.next({ request })

  // ── 7. Security + performance headers ────────────────────────────────────
  response.headers.set('Content-Security-Policy', CSP)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', pathname.startsWith('/api') ? 'DENY' : 'SAMEORIGIN')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.delete('X-Powered-By')

  // Cache public pages at the edge (CDN)  -  revalidated every 60s, stale up to 5min
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

