import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { fetchMarketplaceInquiryThreads } from '@/lib/marketplace/inquiries'

export const dynamic = 'force-dynamic'

/** GET /api/marketplace/inquiries — listing inquiry threads for current user */
export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const threads = await fetchMarketplaceInquiryThreads(getAdminDb(), user.id)
    const unreadTotal = threads.reduce((n, t) => n + t.unreadCount, 0)
    return NextResponse.json({ threads, unreadTotal })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not load inquiries'
    if (message.includes('peer_messages')) {
      return NextResponse.json({ threads: [], unreadTotal: 0, warning: 'Messages not available yet.' })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
