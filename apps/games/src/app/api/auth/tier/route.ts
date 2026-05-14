import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Games app tier check - verify user has pro/premium access
 * Returns: { has_access: boolean, tier: string, message?: string }
 */
export async function GET(req: NextRequest) {
  // Get auth token from Authorization header or cookies
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/, '')

  if (!token) {
    return NextResponse.json(
      { has_access: false, tier: 'free', error: 'No auth token' },
      { status: 401 }
    )
  }

  // Call the main app's tier endpoint
  const mainAppUrl = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')
  const tierResponse = await fetch(`${mainAppUrl}/api/auth/tier?feature=GAMES`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => null)

  if (!tierResponse) {
    return NextResponse.json(
      { has_access: false, tier: 'free', error: 'Unable to verify tier' },
      { status: 503 }
    )
  }

  const data = await tierResponse.json()

  // Return tier info and access status
  return NextResponse.json({
    has_access: tierResponse.ok && (data.has_access === true),
    tier: data.tier ?? 'free',
    ...(tierResponse.ok ? {} : { error: data.error }),
  })
}
