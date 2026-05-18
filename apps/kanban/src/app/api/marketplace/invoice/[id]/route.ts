import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { buildMarketplaceInvoiceResponse } from '@/lib/marketplace/get-invoice-response'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: Request, context: RouteContext) {
  const user = await getRequestUser(req)
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await context.params
  return buildMarketplaceInvoiceResponse(user.id, id)
}
