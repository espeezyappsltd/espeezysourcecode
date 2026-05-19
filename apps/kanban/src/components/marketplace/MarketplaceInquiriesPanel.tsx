'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, Loader2, MessageSquare, Send, X } from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { avatarUrlForProfile } from '@/lib/platform/contact-rules'
import type { MarketplaceInquiryThread } from '@/lib/marketplace/inquiries'
import { FormField } from '@/components/forms/FormField'

type PeerMessage = {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  listing_id?: string | null
  created_at: string
}

type Props = {
  open: boolean
  onClose: () => void
  currentUserId: string | null
  initialPeerId?: string | null
  initialListingId?: string | null
  onUnreadChange?: (count: number) => void
}

export function MarketplaceInquiriesPanel({
  open,
  onClose,
  currentUserId,
  initialPeerId,
  initialListingId,
  onUnreadChange,
}: Props) {
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [threads, setThreads] = useState<MarketplaceInquiryThread[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<{ peerId: string; listingId: string } | null>(null)
  const [messages, setMessages] = useState<PeerMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadThreads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/inquiries', { credentials: 'include' })
      if (!res.ok) return
      const data = (await res.json()) as { threads?: MarketplaceInquiryThread[]; unreadTotal?: number }
      setThreads(data.threads ?? [])
      onUnreadChange?.(data.unreadTotal ?? 0)
    } finally {
      setLoading(false)
    }
  }, [onUnreadChange])

  const loadMessages = useCallback(async (peerId: string) => {
    setThreadLoading(true)
    try {
      const res = await fetch(`/api/peer-messages?peerId=${encodeURIComponent(peerId)}`, {
        credentials: 'include',
      })
      if (!res.ok) return
      const data = (await res.json()) as { messages?: PeerMessage[] }
      setMessages(data.messages ?? [])
      void loadThreads()
    } finally {
      setThreadLoading(false)
    }
  }, [loadThreads])

  useEffect(() => {
    if (!open) return
    void loadThreads()
  }, [open, loadThreads])

  useEffect(() => {
    if (!open || !initialPeerId || !initialListingId) return
    setSelected({ peerId: initialPeerId, listingId: initialListingId })
  }, [open, initialPeerId, initialListingId])

  useEffect(() => {
    if (!selected) {
      setMessages([])
      return
    }
    void loadMessages(selected.peerId)
  }, [selected, loadMessages])

  useEffect(() => {
    if (!currentUserId || !open) return

    const channel = db
      .channel(`mp-inquiries-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'peer_messages' },
        (payload) => {
          const row = payload.new as PeerMessage & { listing_id?: string | null }
          if (!row.listing_id) return
          const involved =
            row.sender_id === currentUserId || row.recipient_id === currentUserId
          if (!involved) return

          void loadThreads()

          if (selected) {
            const inThread =
              (row.sender_id === currentUserId && row.recipient_id === selected.peerId) ||
              (row.sender_id === selected.peerId && row.recipient_id === currentUserId)
            if (inThread) {
              setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
            }
          }
        },
      )
      .subscribe()

    return () => {
      void db.removeChannel(channel)
    }
  }, [db, currentUserId, open, selected, loadThreads])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeThread = selected
    ? threads.find((t) => t.peerId === selected.peerId && t.listingId === selected.listingId)
    : null

  const listingFilteredMessages = selected
    ? messages.filter((m) => !m.listing_id || m.listing_id === selected.listingId)
    : []

  const sendReply = async () => {
    const text = draft.trim()
    if (!text || !selected || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/peer-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientId: selected.peerId,
          message: text,
          listingId: selected.listingId,
        }),
      })
      const data = (await res.json()) as { error?: string; message?: PeerMessage }
      if (!res.ok) {
        alert(data.error ?? 'Could not send reply')
        return
      }
      if (data.message) {
        setMessages((prev) => [...prev, data.message!])
      }
      setDraft('')
      void loadThreads()
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="mp-inquiries-overlay" role="dialog" aria-modal="true" aria-labelledby="mp-inquiries-title">
      <button type="button" className="mp-inquiries-backdrop" aria-label="Close" onClick={onClose} />
      <div className="mp-inquiries-panel">
        <header className="mp-inquiries-header">
          {selected ? (
            <button
              type="button"
              className="mp-inquiries-icon-btn"
              onClick={() => setSelected(null)}
              aria-label="Back to inquiries"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <MessageSquare size={20} style={{ color: 'var(--brand)' }} aria-hidden />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="mp-inquiries-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 950 }}>
              {selected ? activeThread?.peerName ?? 'Inquiry' : 'Marketplace inquiries'}
            </h2>
            {selected && activeThread?.listingTitle ? (
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                Re: {activeThread.listingTitle}
                {activeThread.isSeller ? ' · You are the seller' : ' · You inquired'}
              </p>
            ) : (
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                Buyer & seller chats about listings
              </p>
            )}
          </div>
          <button type="button" className="mp-inquiries-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {!selected ? (
          <div className="mp-inquiries-list">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
              </div>
            ) : threads.length === 0 ? (
              <p style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.88rem' }}>
                No inquiries yet. Contact a seller from any listing to start a chat.
              </p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.threadKey}
                  type="button"
                  className={`mp-inquiry-row${t.unreadCount > 0 ? ' mp-inquiry-row--unread' : ''}`}
                  onClick={() => setSelected({ peerId: t.peerId, listingId: t.listingId })}
                >
                  <Image
                    src={avatarUrlForProfile({
                      id: t.peerId,
                      full_name: t.peerName,
                      avatar_url: t.peerAvatar,
                    })}
                    alt=""
                    width={44}
                    height={44}
                    style={{ borderRadius: 12, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>{t.peerName}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)', flexShrink: 0 }}>
                        {formatTime(t.lastAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand)', fontWeight: 800, marginTop: 2 }}>
                      {t.listingTitle ?? 'Listing'}
                    </div>
                    <p
                      style={{
                        margin: '0.2rem 0 0',
                        fontSize: '0.78rem',
                        color: 'var(--text-sub)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.lastSenderId === currentUserId ? 'You: ' : ''}
                      {t.lastBody}
                    </p>
                  </div>
                  {t.unreadCount > 0 ? (
                    <span className="mp-inquiry-badge">{t.unreadCount}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="mp-inquiries-thread">
              {threadLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
                </div>
              ) : listingFilteredMessages.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.88rem', padding: '1rem' }}>
                  No messages in this thread yet.
                </p>
              ) : (
                listingFilteredMessages.map((m) => {
                  const mine = m.sender_id === currentUserId
                  return (
                    <div
                      key={m.id}
                      className={`mp-inquiry-bubble${mine ? ' mp-inquiry-bubble--mine' : ''}`}
                    >
                      {m.body}
                      <span className="mp-inquiry-bubble__time">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>
            <footer className="mp-inquiries-compose">
              <FormField label="Reply message" hideLabel className="mp-inquiries-compose__field">
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendReply()
                    }
                  }}
                  placeholder="Reply to this inquiry…"
                  maxLength={2000}
                />
              </FormField>
              <button
                type="button"
                className="mp-inquiries-compose__send"
                disabled={sending || !draft.trim()}
                onClick={() => void sendReply()}
                aria-label="Send reply"
              >
                {sending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Send size={18} aria-hidden />}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (now.toDateString() === d.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
