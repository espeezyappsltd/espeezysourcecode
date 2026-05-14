import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/'
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // Handle OAuth provider errors
  if (errorParam || errorDesc) {
    const msg = errorDesc || errorParam || 'OAuth authentication failed'
    console.error('[Prereg Auth Callback] Provider Error:', msg)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
  }

  // Check if this is a password recovery flow
  const isRecovery = searchParams.get('type') === 'recovery'

  // Validate redirect path  -  must be a relative path on same origin (open redirect prevention)
  const isSafeRedirect = next.startsWith('/') && !next.startsWith('//') && !next.includes(':')
  const safePath = isSafeRedirect ? next : '/'

  const redirectPath = isRecovery ? '/reset-password' : safePath
  const redirectUrl = new URL(redirectPath, origin).toString()
  return NextResponse.redirect(redirectUrl)
}
