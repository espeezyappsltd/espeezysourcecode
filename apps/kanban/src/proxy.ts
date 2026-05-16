import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from '@/lib/supabase/env'

// Minimal in-memory rate limit for API routes (use Redis/Upstash in production)
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

const PUBLIC_PREFIXES = [
  '/login',
  '/auth',
  '/api',
  '/preregister',
  '/privacy',
  '/terms',
  '/contact',
  '/docs',
  '/solutions',
  '/product',
  '/fund',
  '/donation',
  '/share',
  '/oauth',
  '/error',
  '/demo',
  '/join',
  '/u/',
  '/id/',
  '/certificate',
  '/games',
  '/checkout',
  '/upgrade/success',
  '/fund/thank-you',
]

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname.includes('.')) return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix),
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(resolveSupabaseUrl(), resolveSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
