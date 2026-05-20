import { verifyFundReceipt } from '@/lib/credits/get-fund-receipt-response'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session_id')
  if (!sessionId) {
    return Response.json({ valid: false, error: 'missing_session' }, { status: 400 })
  }
  return verifyFundReceipt(sessionId, url.searchParams.get('token'))
}
