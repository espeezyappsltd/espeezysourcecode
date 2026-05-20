import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/supabase/admin'
import { buildMarketplaceDocumentResponse } from '@/lib/marketplace/get-document-response'
import type { MarketplaceDocumentKind } from '@/lib/marketplace/document-types'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: Request, context: RouteContext) {
  const user = await getRequestUser(req)
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await context.params
  const url = new URL(req.url)
  const kindParam = url.searchParams.get('kind')
  const forcedKind: MarketplaceDocumentKind | undefined =
    kindParam === 'receipt' ? 'receipt' : kindParam === 'invoice' ? 'invoice' : undefined

  return buildMarketplaceDocumentResponse(user.id, id, {
    forcedKind,
    format: 'pdf',
  })
}
