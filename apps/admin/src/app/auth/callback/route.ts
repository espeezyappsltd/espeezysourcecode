import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeAuthCallback, parseAuthCallbackParams } from '@shared/auth-callback'
import {
  ESPEEZY_APP_ORIGINS,
  resolvePanelOrigin,
  sanitizeNextPath,
  shouldForwardAuthToPanel,
} from '@/lib/app-url'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const params = parseAuthCallbackParams(searchParams)
  const next = searchParams.get('next') ?? '/admin'

  if (shouldForwardAuthToPanel(requestUrl.hostname, searchParams)) {
    const panelCallback = new URL('/auth/callback', ESPEEZY_APP_ORIGINS.panel)
    panelCallback.search = requestUrl.search
    return NextResponse.redirect(panelCallback.toString())
  }

  const supabase = await createClient()
  const result = await completeAuthCallback(supabase, params)

  if (!result.ok) {
    const loginPath = params.isRecovery ? '/auth/reset-password' : '/login'
    return NextResponse.redirect(
      `${resolvePanelOrigin(request)}/login?error=${encodeURIComponent(result.message)}`,
    )
  }

  const safePath = sanitizeNextPath(next, '/admin')
  const redirectPath = params.isRecovery ? '/auth/reset-password' : safePath

  return NextResponse.redirect(new URL(redirectPath, origin).toString())
}
