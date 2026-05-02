import { NextResponse } from 'next/server'
import { auth } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // Handle OAuth provider errors
  if (errorParam || errorDesc) {
    const msg = errorDesc || errorParam || 'OAuth authentication failed'
    console.error('[Auth Callback] Provider Error:', msg)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
  }

  // Firebase handles OAuth redirect automatically — check if user is now authenticated
  const currentUser = auth.currentUser

  if (currentUser) {
    // User is authenticated after OAuth redirect
    // Check if this is a password recovery flow
    const isRecovery = searchParams.get('type') === 'recovery' || !currentUser.metadata.lastSignInTime

    // Validate redirect path — must be a relative path on same origin (open redirect prevention)
    const rawNext = next
    const isSafeRedirect = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes(':')
    const safePath = isSafeRedirect ? rawNext : '/dashboard'

    const redirectPath = isRecovery ? '/auth/reset-password' : safePath
    const redirectUrl = new URL(redirectPath, origin).toString()
    return NextResponse.redirect(redirectUrl)
  }

  // If not authenticated yet, Firebase will handle the redirect naturally.
  // Redirect to login as fallback
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
  )
}
