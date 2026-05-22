import { NextResponse } from 'next/server'

/** Email/SMS OTP login is retired — staff use authenticator apps (TOTP). */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Email and SMS login codes are disabled. Sign in with Microsoft Authenticator (6-digit code) and your staff username.',
      authMethod: 'authenticator',
    },
    { status: 410 },
  )
}
