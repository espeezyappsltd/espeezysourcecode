import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveSupabaseEnv } from '@/lib/supabase-env'
import { attachTierCacheCookie, resolveGamesTier } from '@/lib/resolve-games-tier'
import { hasGamesAccess } from '@/lib/games-tier'
import { sanitizeNextPath } from '@shared/app-url'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isEmbed = request.nextUrl.searchParams.get('embed') === '1'

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/sso') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')

  const { url: supabaseUrl, anonKey: supabaseKey } = resolveSupabaseEnv()

  if (!supabaseUrl || !supabaseKey) {
    if (isPublicRoute) {
      return NextResponse.next({ request })
    }

    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    const bypassEmails = (process.env.AUTH_TIER_BYPASS_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
    const emailBypass = Boolean(user.email && bypassEmails.includes(user.email.toLowerCase()))

    let tier: Awaited<ReturnType<typeof resolveGamesTier>>['tier'] = 'free'
    let tierSource: Awaited<ReturnType<typeof resolveGamesTier>>['source'] = 'database'

    if (!emailBypass) {
      const resolved = await resolveGamesTier(user, request, supabase)
      tier = resolved.tier
      tierSource = resolved.source
      if (tierSource !== 'jwt') {
        attachTierCacheCookie(supabaseResponse, tier)
      }
    }

    if (!emailBypass && !hasGamesAccess(tier)) {
      if (request.nextUrl.searchParams.get('upgrade') !== '1') {
        const upgradeUrl = request.nextUrl.clone()
        upgradeUrl.pathname = '/login'
        upgradeUrl.searchParams.set('upgrade', '1')
        const redirect = NextResponse.redirect(upgradeUrl)
        if (tierSource !== 'jwt') {
          attachTierCacheCookie(redirect, tier)
        }
        return redirect
      }
      return supabaseResponse
    }

    const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'))
    const dest = request.nextUrl.clone()
    dest.pathname = next
    dest.search = ''
    return NextResponse.redirect(dest)
  }

  if (!user && pathname === '/' && isEmbed) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('embed', '1')
    return NextResponse.redirect(loginUrl)
  }

  if (isPublicRoute) {
    return supabaseResponse
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const bypassEmails = (process.env.AUTH_TIER_BYPASS_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  if (user.email && bypassEmails.includes(user.email.toLowerCase())) {
    return supabaseResponse
  }

  const { tier, source } = await resolveGamesTier(user, request, supabase)

  if (source !== 'jwt') {
    attachTierCacheCookie(supabaseResponse, tier)
  }

  if (!hasGamesAccess(tier)) {
    const upgradeUrl = request.nextUrl.clone()
    upgradeUrl.pathname = '/login'
    upgradeUrl.searchParams.set('upgrade', '1')
    const redirect = NextResponse.redirect(upgradeUrl)
    if (source !== 'jwt') {
      attachTierCacheCookie(redirect, tier)
    }
    return redirect
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
