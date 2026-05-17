import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNextPath } from '@shared/app-url'
import { attachTierCacheCookie } from '@/lib/resolve-games-tier'
import { fetchProfileTier, syncTierToJwt } from '@/lib/games-tier'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const origin = requestUrl.origin
  const next = searchParams.get('next') ?? '/'
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')
  const code = searchParams.get('code')
  const isRecovery = searchParams.get('type') === 'recovery'

  if (errorParam || errorDesc) {
    const msg = errorDesc || errorParam || 'OAuth authentication failed'
    console.error('[Games Auth Callback] Provider Error:', msg)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
  }

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  const safePath = sanitizeNextPath(next)
  const redirectPath = isRecovery ? '/reset-password' : safePath
  const response = NextResponse.redirect(new URL(redirectPath, origin).toString())

  if (!isRecovery) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const tier = await fetchProfileTier(supabase, user.id)
      attachTierCacheCookie(response, tier)
      void syncTierToJwt(user.id, tier)
    }
  }

  return response
}
