import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeAuthCallback, parseAuthCallbackParams } from '@shared/auth-callback'
import { ESPEEZY_APP_ORIGINS, sanitizeKanbanNextPath, shouldForwardAuthToKanban } from '@/lib/app-url'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const params = parseAuthCallbackParams(searchParams)
  const next = searchParams.get('next') ?? '/'

  if (shouldForwardAuthToKanban(requestUrl.hostname, searchParams)) {
    const kanbanCallback = new URL('/auth/callback', ESPEEZY_APP_ORIGINS.kanban)
    kanbanCallback.search = requestUrl.search
    return NextResponse.redirect(kanbanCallback.toString())
  }

  const supabase = await createClient()
  const result = await completeAuthCallback(supabase, params)

  if (!result.ok) {
    const loginPath = params.isRecovery ? '/auth/reset-password' : '/login'
    return NextResponse.redirect(
      `${origin}${loginPath}?error=${encodeURIComponent(result.message)}`,
    )
  }

  const safePath = sanitizeKanbanNextPath(next)
  const redirectPath = params.isRecovery ? '/auth/reset-password' : safePath

  return NextResponse.redirect(new URL(redirectPath, origin).toString())
}
