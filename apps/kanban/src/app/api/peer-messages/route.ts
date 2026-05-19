import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { validateMarketplaceContact } from '@/lib/platform/contact-rules'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const peerId = new URL(req.url).searchParams.get('peerId')
  if (!peerId) {
    return NextResponse.json({ error: 'peerId required' }, { status: 400 })
  }

  const db = getAdminDb()
  const { data, error } = await db
    .from('peer_messages')
    .select('id, sender_id, recipient_id, body, listing_id, read_at, created_at')
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${user.id})`,
    )
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await db
    .from('peer_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('sender_id', peerId)
    .is('read_at', null)

  return NextResponse.json({ messages: data ?? [] })
}

export async function POST(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { recipientId?: string; message?: string; listingId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const recipientId = body.recipientId?.trim()
  const message = body.message?.trim()
  if (!recipientId || !message) {
    return NextResponse.json({ error: 'recipientId and message required' }, { status: 400 })
  }
  const db = getAdminDb()

  const { data: senderProfile } = await db
    .from('profiles')
    .select('account_status, full_name, username')
    .eq('id', user.id)
    .maybeSingle()

  let listingOwnerId: string | null = null
  let listingStatus: string | null = null
  if (body.listingId) {
    const { data: listing } = await db
      .from('marketplace_listings')
      .select('owner_id, status')
      .eq('id', body.listingId)
      .maybeSingle()
    listingOwnerId = listing?.owner_id ?? null
    listingStatus = listing?.status ?? null
  }

  const check = validateMarketplaceContact({
    senderId: user.id,
    recipientId,
    message,
    listingId: body.listingId ?? null,
    listingOwnerId,
    listingStatus,
    senderAccountStatus: senderProfile?.account_status ?? 'active',
  })

  if (!check.ok) {
    return NextResponse.json({ error: check.message, code: check.code }, { status: 400 })
  }

  const { data: row, error } = await db
    .from('peer_messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      body: message.slice(0, 4000),
      listing_id: body.listingId ?? null,
    })
    .select('id, sender_id, recipient_id, body, listing_id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const senderLabel = senderProfile?.full_name ?? senderProfile?.username ?? 'Someone'

  await db.from('notifications').insert({
    user_id: recipientId,
    type: 'peer_message',
    title: 'New message',
    message: `${senderLabel}: ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`,
    link: `/marketplace?inquiry=${encodeURIComponent(recipientId)}${body.listingId ? `&listing=${body.listingId}` : ''}`,
    metadata: { sender_id: user.id, listing_id: body.listingId ?? null },
  })

  return NextResponse.json({ message: row }, { status: 201 })
}
