import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeAuthCallback, parseAuthCallbackParams } from '@shared/auth-callback'
import { sanitizeNextPath } from '@shared/app-url'

export const dynamic = 'force-dynamic'

function studiosPostLoginPath(next: string | null): string {
  const safe = sanitizeNextPath(next, '/')
  if (safe === '/login' || safe.startsWith('/login?') || safe.startsWith('/auth/')) {
    return '/'
  }
  return safe
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const params = parseAuthCallbackParams(searchParams)
  const next = searchParams.get('next')

  const supabase = await createClient()
  const result = await completeAuthCallback(supabase, params)

  if (!result.ok) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(result.message)}`)
  }

  const redirectPath = studiosPostLoginPath(next)
  return NextResponse.redirect(new URL(redirectPath, origin).toString())
}
