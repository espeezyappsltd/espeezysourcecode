import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeAuthCallback, parseAuthCallbackParams } from '@shared/auth-callback'
import { sanitizeNextPath } from '@shared/app-url'
import { attachTierCacheCookie } from '@/lib/resolve-games-tier'
import { fetchProfileTier, syncTierToJwt } from '@/lib/games-tier'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const params = parseAuthCallbackParams(searchParams)
  const next = searchParams.get('next') ?? '/'

  const supabase = await createClient()
  const result = await completeAuthCallback(supabase, params)

  if (!result.ok) {
    const loginPath = params.isRecovery ? '/reset-password' : '/login'
    return NextResponse.redirect(
      `${origin}${loginPath}?error=${encodeURIComponent(result.message)}`,
    )
  }

  const safePath = sanitizeNextPath(next)
  const redirectPath = params.isRecovery ? '/reset-password' : safePath
  const response = NextResponse.redirect(new URL(redirectPath, origin).toString())

  if (!params.isRecovery) {
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
