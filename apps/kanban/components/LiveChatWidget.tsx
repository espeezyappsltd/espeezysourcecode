'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchChatMessages, postChatPresence, sendChatMessage } from '../services/chat'

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

function isChatEvent(value: unknown): value is ChatEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Record<string, unknown>
  return typeof event.id === 'string' && typeof event.event_type === 'string' && typeof event.created_at === 'string'
}

export default function LiveChatWidget({ appScope }: { appScope: 'prereg' | 'games' | 'kanban' }) {
  const initialUser = getOrCreateClientUser()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newUserEvent, setNewUserEvent] = useState<ChatEvent | null>(null)
  const [text, setText] = useState('')
  const [username, setUsername] = useState(initialUser.username)
  const [userId] = useState(initialUser.userId)
  const [loading, setLoading] = useState(false)
  const lastSeenEventIdRef = useRef('')
  const clearEventTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    postChatPresence({ app_scope: appScope, event_type: 'new_user', user_id: userId, username }).catch(() => undefined)
  }, [appScope, userId, username])

  async function loadMessages() {
    const data = await fetchChatMessages(appScope, 30)
    if (Array.isArray(data.messages)) {
      setMessages(data.messages)
    }
    if (isChatEvent(data.new_user_event) && data.new_user_event.id !== lastSeenEventIdRef.current) {
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
      postChatPresence({ app_scope: appScope, event_type: 'active', user_id: userId || 'guest', username: username || 'guest' }).catch(() => undefined)
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
      const res = await sendChatMessage({
        app_scope: appScope,
        user_id: userId,
        username,
        message: text.trim(),
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
            <button type='button' onClick={() => setOpen(false)} aria-label="Close chat" style={{ background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0.25rem 0.5rem' }}>X</button>
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
