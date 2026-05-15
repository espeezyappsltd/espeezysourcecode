'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { fetchChatMessages, postChatPresence, sendChatMessage } from '@/services/chat'

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

  const loadMessages = useCallback(async () => {
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
  }, [appScope])

  // Load initial messages on mount, outside of effect to avoid cascading renders
  const hasLoadedInitialMessages = useRef(false)
  useEffect(() => {
    if (!hasLoadedInitialMessages.current) {
      hasLoadedInitialMessages.current = true
      void loadMessages()
    }
    const poll = setInterval(() => {
      void loadMessages()
      postChatPresence({ app_scope: appScope, event_type: 'active', user_id: userId || 'guest', username: username || 'guest' }).catch(() => undefined)
    }, 5000)

    return () => clearInterval(poll)
  }, [appScope, userId, username, loadMessages])

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
        <div style={{ position: 'fixed', right: '1.5rem', bottom: '6rem', zIndex: 1200, background: 'white', color: '#0f172a', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 10px 40px rgba(15,23,42,0.12)', borderLeft: '4px solid #6366f1' }}>
          {newUserEvent.username} joined live chat
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', right: '1.5rem', bottom: '5.5rem', width: '340px', maxHeight: '500px', zIndex: 1200, background: 'white', color: '#0f172a', border: '1px solid rgba(15,23,42,0.12)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(15,23,42,0.15)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <strong style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Community Support</strong>
            </div>
            <button type='button' onClick={() => setOpen(false)} aria-label="Close chat" style={{ background: 'rgba(15,23,42,0.05)', color: '#64748b', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900 }}>✕</button>
          </div>

          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <input
              value={username}
              onChange={(e) => {
                const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
                setUsername(clean)
                if (clean.length >= 3) {
                  window.localStorage.setItem(CHAT_USER_KEY, JSON.stringify({ userId, username: clean, created: new Date().toISOString() }))
                }
              }}
              placeholder='Set your username'
              style={{ width: '100%', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.1)', background: '#f1f5f9', color: '#0f172a', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ffffff' }}>
            {orderedMessages.map((m) => (
              <div key={m.id} style={{ alignSelf: m.username === username ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '0.2rem', textAlign: m.username === username ? 'right' : 'left', padding: '0 0.4rem' }}>{m.username}</div>
                <div style={{ background: m.username === username ? '#6366f1' : '#f1f5f9', color: m.username === username ? 'white' : '#0f172a', borderRadius: '14px', borderTopRightRadius: m.username === username ? '2px' : '14px', borderTopLeftRadius: m.username === username ? '14px' : '2px', padding: '0.6rem 0.8rem', fontSize: '0.85rem', lineHeight: 1.4, boxShadow: m.username === username ? '0 4px 12px rgba(99,102,241,0.2)' : 'none' }}>
                  {m.message}
                </div>
              </div>
            ))}
            {orderedMessages.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
                <p>No messages yet.</p>
                <p style={{ fontSize: '0.75rem' }}>Be the first to say hello!</p>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} style={{ borderTop: '1px solid rgba(15,23,42,0.06)', padding: '0.85rem 1rem', display: 'flex', gap: '0.5rem', background: 'white' }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Type a message...'
              maxLength={1000}
              style={{ flex: 1, borderRadius: '12px', border: '1px solid rgba(15,23,42,0.1)', background: '#ffffff', color: '#0f172a', padding: '0.6rem 0.8rem', fontSize: '0.85rem', outline: 'none' }}
            />
            <button type='submit' disabled={loading || username.trim().length < 3} style={{ borderRadius: '12px', border: 'none', background: '#6366f1', color: 'white', padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.1s ease', opacity: (loading || username.trim().length < 3) ? 0.5 : 1 }}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'fixed', right: '1.5rem', bottom: '1.5rem', zIndex: 1200, border: 'none', borderRadius: '18px', padding: '0 1.5rem', height: '48px', background: '#0f172a', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 25px rgba(15,23,42,0.25)', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s ease' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(15,23,42,0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(15,23,42,0.25)'
        }}
        aria-label='Toggle live chat'
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
        Live Support
      </button>
    </>
  )
}
