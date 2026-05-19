'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Loader2, Send, Package } from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'

type PeerMessage = {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  listing_id?: string | null
  created_at: string
}

type PeerProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  username?: string | null
}

export default function PeerMessagesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const peerId = (params?.id ?? '') as string
  const listingId = searchParams?.get('listing') ?? null

  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [messages, setMessages] = useState<PeerMessage[]>([])
  const [peer, setPeer] = useState<PeerProfile | null>(null)
  const [listingTitle, setListingTitle] = useState<string | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadThread = useCallback(async () => {
    if (!peerId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/peer-messages?peerId=${encodeURIComponent(peerId)}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = (await res.json()) as { messages?: PeerMessage[] }
        setMessages(data.messages ?? [])
      }

      const { data: profile } = await db
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .eq('id', peerId)
        .maybeSingle()
      if (profile) setPeer(profile as PeerProfile)

      if (listingId) {
        const { data: listing } = await db
          .from('marketplace_listings')
          .select('title')
          .eq('id', listingId)
          .maybeSingle()
        if (listing?.title) setListingTitle(listing.title)
      }
    } finally {
      setLoading(false)
    }
  }, [db, listingId, peerId])

  useEffect(() => {
    db.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
    void loadThread()
  }, [db, loadThread])

  useEffect(() => {
    if (!myId || !peerId) return

    const channel = db
      .channel(`peer-messages-${myId}-${peerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'peer_messages',
        },
        (payload) => {
          const row = payload.new as PeerMessage
          const inThread =
            (row.sender_id === myId && row.recipient_id === peerId) ||
            (row.sender_id === peerId && row.recipient_id === myId)
          if (!inThread) return
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
        },
      )
      .subscribe()

    return () => {
      void db.removeChannel(channel)
    }
  }, [db, myId, peerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/peer-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientId: peerId,
          message: text,
          listingId: listingId ?? undefined,
        }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        alert(err.error ?? 'Could not send message')
        return
      }
      const data = (await res.json()) as { message?: PeerMessage }
      if (data.message) {
        setMessages((prev) => [...prev, data.message!])
      }
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  const peerName = peer?.full_name ?? peer?.username ?? 'User'

  return (
    <div className="page-fade page-shell page-shell--narrow" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
      <header className="page-header page-header--bar">
        <button type="button" onClick={() => router.back()} style={{ background: 'var(--bg-sub)', border: 'none', borderRadius: '12px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--brand)', overflow: 'hidden' }}>
          {peer?.avatar_url && <Image src={peer.avatar_url} width={40} height={40} alt="" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 950, fontSize: '1rem' }}>{peerName}</div>
          <Link href={`/network/profile/${peerId}`} style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 700 }}>
            View profile
          </Link>
        </div>
      </header>

      {listingTitle && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(var(--brand-rgb), 0.08)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <Package size={16} style={{ color: 'var(--brand)' }} />
          <span>
            Re: <strong>{listingTitle}</strong>
          </span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
          </div>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.9rem' }}>No messages yet. Say hello about this listing.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === myId
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '0.65rem 1rem',
                  borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: mine ? 'var(--brand)' : 'var(--surface)',
                  color: mine ? '#000' : 'var(--text-main)',
                  border: mine ? 'none' : '1px solid var(--border)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}
              >
                {m.body}
                <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.25rem' }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void sendMessage()}
          placeholder="Message about this item…"
          style={{
            flex: 1,
            padding: '0.85rem 1rem',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            background: 'var(--bg-sub)',
            color: 'var(--text-main)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          disabled={sending || !draft.trim()}
          onClick={() => void sendMessage()}
          style={{
            padding: '0.85rem 1.1rem',
            borderRadius: '14px',
            border: 'none',
            background: 'var(--brand)',
            color: '#000',
            fontWeight: 950,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  )
}
