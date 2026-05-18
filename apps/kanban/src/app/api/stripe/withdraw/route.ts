import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/stripe/withdraw
 * @deprecated Use POST /api/assets/withdraw with { creditsAmount } (marketplace earnings cap).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const creditsAmount =
    typeof body?.creditsAmount === 'number'
      ? body.creditsAmount
      : typeof body?.amountCents === 'number'
        ? Math.max(1, Math.round(body.amountCents / 10))
        : undefined

  if (!creditsAmount) {
    return NextResponse.json(
      {
        error:
          'Use POST /api/assets/withdraw with creditsAmount. Withdrawals are limited to asset value × times sold on the marketplace.',
      },
      { status: 400 },
    )
  }

  const origin = new URL(req.url).origin
  const forward = await fetch(`${origin}/api/assets/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
      authorization: req.headers.get('authorization') ?? '',
    },
    body: JSON.stringify({ creditsAmount }),
  })

  const data = await forward.json().catch(() => ({}))
  return NextResponse.json(data, { status: forward.status })
}
