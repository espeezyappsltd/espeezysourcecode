import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ESPEEZY_APP_ORIGINS, shouldForwardAuthToKanban } from '@/lib/app-url'

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

  // Recovery links sometimes fall back to espeezy.com when redirect_to is not allow-listed.
  if (shouldForwardAuthToKanban(requestUrl.hostname, searchParams)) {
    const kanbanCallback = new URL('/auth/callback', ESPEEZY_APP_ORIGINS.kanban)
    kanbanCallback.search = requestUrl.search
    return NextResponse.redirect(kanbanCallback.toString())
  }

  if (errorParam || errorDesc) {
    const msg = errorDesc || errorParam || 'OAuth authentication failed'
    console.error('[Auth Callback] Provider Error:', msg)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  const isSafeRedirect = next.startsWith('/') && !next.startsWith('//') && !next.includes(':')
  const safePath = isSafeRedirect ? next : '/'
  const redirectPath = isRecovery ? '/auth/reset-password' : safePath

  return NextResponse.redirect(new URL(redirectPath, origin).toString())
}
