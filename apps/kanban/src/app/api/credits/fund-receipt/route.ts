import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { buildFundReceiptResponse } from '@/lib/credits/get-fund-receipt-response'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const sessionId = new URL(req.url).searchParams.get('session_id')
  if (!sessionId) {
    return new NextResponse('Missing session_id', { status: 400 })
  }

  return buildFundReceiptResponse(user.id, sessionId, 'html')
}
