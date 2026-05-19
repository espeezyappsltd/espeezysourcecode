import type { getAdminDb } from '@/lib/supabase/admin'

export type MarketplaceInquiryThread = {
  threadKey: string
  peerId: string
  listingId: string
  listingTitle: string | null
  listingStatus: string | null
  peerName: string
  peerAvatar: string | null
  lastBody: string
  lastAt: string
  lastSenderId: string
  unreadCount: number
  isSeller: boolean
}

type RawMessage = {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  listing_id: string | null
  read_at: string | null
  created_at: string
}

export async function fetchMarketplaceInquiryThreads(
  adminDb: ReturnType<typeof getAdminDb>,
  userId: string,
): Promise<MarketplaceInquiryThread[]> {
  const { data: rows, error } = await adminDb
    .from('peer_messages')
    .select('id, sender_id, recipient_id, body, listing_id, read_at, created_at')
    .not('listing_id', 'is', null)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) throw error

  const messages = (rows ?? []) as RawMessage[]
  if (messages.length === 0) return []

  const threadMap = new Map<
    string,
    {
      peerId: string
      listingId: string
      last: RawMessage
      unreadCount: number
    }
  >()

  for (const m of messages) {
    if (!m.listing_id) continue
    const peerId = m.sender_id === userId ? m.recipient_id : m.sender_id
    const key = `${peerId}:${m.listing_id}`
    const existing = threadMap.get(key)
    if (!existing) {
      const unread = m.recipient_id === userId && !m.read_at ? 1 : 0
      threadMap.set(key, { peerId, listingId: m.listing_id, last: m, unreadCount: unread })
      continue
    }
    if (m.recipient_id === userId && !m.read_at) {
      existing.unreadCount += 1
    }
  }

  const threads = Array.from(threadMap.entries())
  const listingIds = [...new Set(threads.map(([, t]) => t.listingId))]
  const peerIds = [...new Set(threads.map(([, t]) => t.peerId))]

  const [{ data: listings }, { data: profiles }] = await Promise.all([
    listingIds.length
      ? adminDb.from('marketplace_listings').select('id, title, status, owner_id').in('id', listingIds)
      : Promise.resolve({ data: [] }),
    peerIds.length
      ? adminDb.from('profiles').select('id, full_name, username, avatar_url').in('id', peerIds)
      : Promise.resolve({ data: [] }),
  ])

  const listingById = new Map(
    (listings ?? []).map((l) => [
      l.id as string,
      {
        title: l.title as string | null,
        status: l.status as string | null,
        owner_id: l.owner_id as string,
      },
    ]),
  )
  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        full_name: p.full_name as string | null,
        username: p.username as string | null,
        avatar_url: p.avatar_url as string | null,
      },
    ]),
  )

  return threads
    .map(([threadKey, t]) => {
      const listing = listingById.get(t.listingId)
      const profile = profileById.get(t.peerId)
      return {
        threadKey,
        peerId: t.peerId,
        listingId: t.listingId,
        listingTitle: listing?.title ?? null,
        listingStatus: listing?.status ?? null,
        peerName: profile?.full_name ?? profile?.username ?? 'Scholar',
        peerAvatar: profile?.avatar_url ?? null,
        lastBody: t.last.body,
        lastAt: t.last.created_at,
        lastSenderId: t.last.sender_id,
        unreadCount: t.unreadCount,
        isSeller: listing?.owner_id === userId,
      }
    })
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
}
