import { NextResponse } from 'next/server'
import { ESPEEZY_APP_ORIGINS, shouldForwardAuthToKanban } from '@shared/app-url'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const origin = requestUrl.origin
  const next = searchParams.get('next') ?? '/'
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')
  const isRecovery = searchParams.get('type') === 'recovery'

  if (shouldForwardAuthToKanban(requestUrl.hostname, searchParams)) {
    const kanbanCallback = new URL('/auth/callback', ESPEEZY_APP_ORIGINS.kanban)
    kanbanCallback.search = requestUrl.search
    return NextResponse.redirect(kanbanCallback.toString())
  }

  if (errorParam || errorDesc) {
    const msg = errorDesc || errorParam || 'OAuth authentication failed'
    console.error('[Prereg Auth Callback] Provider Error:', msg)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
  }

  const isSafeRedirect = next.startsWith('/') && !next.startsWith('//') && !next.includes(':')
  const safePath = isSafeRedirect ? next : '/'
  const redirectPath = isRecovery ? '/reset-password' : safePath
  const redirectUrl = new URL(redirectPath, origin)
  redirectUrl.search = requestUrl.search

  return NextResponse.redirect(redirectUrl.toString())
}
