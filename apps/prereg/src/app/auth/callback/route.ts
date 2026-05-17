import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ESPEEZY_APP_ORIGINS, sanitizeNextPath, shouldForwardAuthToKanban } from '@shared/app-url'

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

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  const safePath = sanitizeNextPath(next)
  const redirectPath = isRecovery ? '/reset-password' : safePath

  return NextResponse.redirect(new URL(redirectPath, origin).toString())
}
