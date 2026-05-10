'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'

type ChatMessage = {
  id: string
  username: string
  message: string
  created_at: string
  status: string
}

type ChatEvent = {
  id: string
  event_type: string
  username?: string
  created_at: string
}

function deriveUsername(user: User): string {
  const email = user.email ?? ''
  // Use the part before @ as the display name, sanitised
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24) || `user_${user.id.slice(0, 6)}`
}

export default function LiveChatWidget({
  appScope,
  user,
}: {
  appScope: 'prereg' | 'games' | 'kanban'
  user: User
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newUserEvent, setNewUserEvent] = useState<ChatEvent | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const lastSeenEventIdRef = useRef('')
  const clearEventTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const username = deriveUsername(user)
  const userId = user.id

  // Announce presence on mount
  useEffect(() => {
    fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_scope: appScope, event_type: 'new_user', user_id: userId, username }),
    }).catch(() => undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appScope, userId])

  async function loadMessages() {
    const res = await fetch(`/api/chat/messages?app_scope=${encodeURIComponent(appScope)}&limit=30`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({ messages: [] }))
    if (Array.isArray(data.messages)) {
      setMessages(data.messages)
    }
    if (data.new_user_event && data.new_user_event.id && data.new_user_event.id !== lastSeenEventIdRef.current) {
      lastSeenEventIdRef.current = data.new_user_event.id
      setNewUserEvent(data.new_user_event)
      if (clearEventTimeoutRef.current) {
        clearTimeout(clearEventTimeoutRef.current)
      }
      clearEventTimeoutRef.current = setTimeout(() => setNewUserEvent(null), 5000)
    }
  }

  useEffect(() => {
    void loadMessages()
    const poll = setInterval(() => {
      void loadMessages()
      fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_scope: appScope, event_type: 'active', user_id: userId || 'guest', username: username || 'guest' }),
      }).catch(() => undefined)
    }, 5000)

    return () => clearInterval(poll)
  }, [appScope, userId, username])

  useEffect(() => {
    return () => {
      if (clearEventTimeoutRef.current) {
        clearTimeout(clearEventTimeoutRef.current)
      }
    }
  }, [])

  const orderedMessages = useMemo(() => messages.slice(-20), [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !username.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_scope: appScope,
          user_id: userId,
          username,
          message: text.trim(),
        }),
      })

      if (res.ok) {
        setText('')
        void loadMessages()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {newUserEvent && newUserEvent.username && (
        <div style={{ position: 'fixed', right: '1rem', bottom: '5.5rem', zIndex: 1200, background: '#111827', color: '#f9fafb', border: '1px solid #374151', borderRadius: '10px', padding: '0.6rem 0.8rem', fontSize: '0.8rem', boxShadow: '0 6px 20px rgba(0,0,0,0.35)' }}>
          {newUserEvent.username} joined live chat
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', right: '1rem', bottom: '4.5rem', width: '320px', maxHeight: '420px', zIndex: 1200, background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.85rem' }}>Live Chat ({appScope})</strong>
            <button type='button' onClick={() => setOpen(false)} aria-label="Close chat" style={{ background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0.25rem 0.5rem' }}>×</button>
          </div>

          <div style={{ padding: '0.5rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            Chatting as <strong style={{ color: '#10b981' }}>{username}</strong>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {orderedMessages.map((m) => (
              <div key={m.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.45rem 0.55rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>{m.username}</div>
                <div style={{ fontSize: '0.82rem', color: '#e5e7eb', wordBreak: 'break-word' }}>{m.message}</div>
              </div>
            ))}
            {orderedMessages.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No messages yet. Say hi.</div>}
          </div>

          <form onSubmit={sendMessage} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', display: 'flex', gap: '0.4rem' }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Type message'
              maxLength={1000}
              style={{ flex: 1, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#111827', color: '#f9fafb', padding: '0.45rem 0.55rem', fontSize: '0.8rem' }}
            />
            <button type='submit' disabled={loading || !text.trim()} style={{ borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', padding: '0.45rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 1200, border: 'none', borderRadius: '999px', width: '52px', height: '52px', background: '#10b981', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.4)' }}
        aria-label='Toggle live chat'
      >
        Chat
      </button>
    </>
  )
}
