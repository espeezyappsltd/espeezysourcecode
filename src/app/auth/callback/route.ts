import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')
  const code = searchParams.get('code')

  // Handle OAuth provider errors
  if (errorParam || errorDesc) {
    const msg = errorDesc || errorParam || 'OAuth authentication failed'
    console.error('[Auth Callback] Provider Error:', msg)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
  }

  // Check if this is a password recovery flow
  const isRecovery = searchParams.get('type') === 'recovery'

  // Supabase OAuth and magic links send an auth code that must be exchanged for a session.
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // Validate redirect path — must be a relative path on same origin (open redirect prevention)
  const isSafeRedirect = next.startsWith('/') && !next.startsWith('//') && !next.includes(':')
  const safePath = isSafeRedirect ? next : '/dashboard'

  const redirectPath = isRecovery ? '/auth/reset-password' : safePath
  const redirectUrl = new URL(redirectPath, origin).toString()
  return NextResponse.redirect(redirectUrl)
}
