'use client'

import { useEffect, useMemo, useState } from 'react'

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

const CHAT_USER_KEY = 'espeezy_chat_user'

function getOrCreateClientUser() {
  const existing = typeof window !== 'undefined' ? window.localStorage.getItem(CHAT_USER_KEY) : null
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as { userId: string; username: string; created: string }
      if (parsed.userId && parsed.username) return parsed
    } catch {
      // no-op
    }
  }

  const generated = {
    userId: `guest_${Math.random().toString(36).slice(2, 10)}`,
    username: `student_${Math.random().toString(36).slice(2, 8)}`,
    created: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CHAT_USER_KEY, JSON.stringify(generated))
  }

  return generated
}

export default function LiveChatWidget({ appScope }: { appScope: 'prereg' | 'games' | 'kanban' }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newUserEvent, setNewUserEvent] = useState<ChatEvent | null>(null)
  const [lastSeenEventId, setLastSeenEventId] = useState('')
  const [text, setText] = useState('')
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = getOrCreateClientUser()
    setUsername(user.username)
    setUserId(user.userId)

    fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_scope: appScope, event_type: 'new_user', user_id: user.userId, username: user.username }),
    }).catch(() => undefined)
  }, [appScope])

  async function loadMessages() {
    const res = await fetch(`/api/chat/messages?app_scope=${encodeURIComponent(appScope)}&limit=30`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({ messages: [] }))
    if (Array.isArray(data.messages)) {
      setMessages(data.messages)
    }
    if (data.new_user_event && data.new_user_event.id && data.new_user_event.id !== lastSeenEventId) {
      setLastSeenEventId(data.new_user_event.id)
      setNewUserEvent(data.new_user_event)
      setTimeout(() => setNewUserEvent(null), 5000)
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
  }, [appScope, lastSeenEventId, userId, username])

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
            <button type='button' onClick={() => setOpen(false)} style={{ background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer' }}>x</button>
          </div>

          <div style={{ padding: '0.5rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              value={username}
              onChange={(e) => {
                const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
                setUsername(clean)
                if (clean.length >= 3) {
                  window.localStorage.setItem(CHAT_USER_KEY, JSON.stringify({ userId, username: clean, created: new Date().toISOString() }))
                }
              }}
              placeholder='username'
              style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#111827', color: '#f9fafb', padding: '0.45rem 0.55rem', fontSize: '0.8rem' }}
            />
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
            <button type='submit' disabled={loading || username.trim().length < 3} style={{ borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', padding: '0.45rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 1200, border: 'none', borderRadius: '999px', width: '52px', height: '52px', background: '#6366f1', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.4)' }}
        aria-label='Toggle live chat'
      >
        Chat
      </button>
    </>
  )
}
