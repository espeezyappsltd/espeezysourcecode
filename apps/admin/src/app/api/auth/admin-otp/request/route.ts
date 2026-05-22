import { NextResponse } from 'next/server'

/** Email/SMS OTP login is retired — staff use authenticator apps (TOTP). */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Email login codes are disabled. Use Google Authenticator, 1Password, Authy, or Microsoft Authenticator with your staff username.',
      authMethod: 'authenticator',
    },
    { status: 410 },
  )
}
