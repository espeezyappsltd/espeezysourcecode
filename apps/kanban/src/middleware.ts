import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveSupabaseAnonKey, resolveSupabaseUrl } from '@/lib/supabase/env'
import { sanitizeKanbanNextPath } from '@shared/app-url'

const PUBLIC_PREFIXES = [
  '/login',
  '/sso',
  '/auth',
  '/api',
  '/privacy',
  '/terms',
  '/contact',
  '/error',
  '/pricing',
  '/upgrade',
  '/upgrade/success',
]

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname.includes('.')) return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix),
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isEmbed = request.nextUrl.searchParams.get('embed') === '1'

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

  if (user && pathname === '/login' && !isEmbed) {
    const next = sanitizeKanbanNextPath(request.nextUrl.searchParams.get('next'))
    const dest = request.nextUrl.clone()
    dest.pathname = next
    dest.search = ''
    return NextResponse.redirect(dest)
  }

  if (user && (pathname === '/sso' || pathname.startsWith('/sso/'))) {
    const dest = request.nextUrl.clone()
    dest.pathname = sanitizeKanbanNextPath(request.nextUrl.searchParams.get('next'))
    dest.search = ''
    return NextResponse.redirect(dest)
  }

  if (!user && pathname === '/' && isEmbed) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('embed', '1')
    return NextResponse.redirect(loginUrl)
  }

  if (isPublicRoute(pathname)) {
    return supabaseResponse
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', sanitizeKanbanNextPath(pathname))
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
