import { verifyMarketplaceDocument } from '@/lib/marketplace/get-document-response'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** Public verification — no auth; requires matching verify token. */
export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params
  const token = new URL(req.url).searchParams.get('token')
  return verifyMarketplaceDocument(id, token)
}
