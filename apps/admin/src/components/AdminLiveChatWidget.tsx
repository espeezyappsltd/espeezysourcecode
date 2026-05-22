'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'

type ChatMessage = {
  id: string
  username: string
  message: string
  created_at: string
}

type ChatEvent = {
  id: string
  event_type: string
  username?: string
  created_at: string
}

type StaffPresence = {
  username: string
  display_name: string | null
  last_seen_at: string | null
}

const ONLINE_MS = 90_000

export default function AdminLiveChatWidget({
  appScope = 'admin',
}: {
  appScope?: 'admin' | 'hub'
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [events, setEvents] = useState<ChatEvent[]>([])
  const [staff, setStaff] = useState<StaffPresence[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const lastEventIdRef = useRef('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [])

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/chat/messages?app_scope=${encodeURIComponent(appScope)}&limit=40`,
      { cache: 'no-store' },
    )
    if (!res.ok) return
    const data = await res.json()
    setMessages(data.messages ?? [])
    setStaff(data.online_staff ?? [])
    setMe(data.me ?? null)

    const incoming: ChatEvent[] = data.events ?? []
    setEvents(incoming)

    for (const ev of incoming) {
      if (!ev.id || ev.id === lastEventIdRef.current) continue
      if (ev.event_type === 'join' && ev.username && ev.username !== me) {
        lastEventIdRef.current = ev.id
        showToast(`${ev.username} is online`)
        if (typeof window !== 'undefined' && window.Notification?.permission === 'granted') {
          new window.Notification('Admin online', { body: `${ev.username} joined`, icon: '/favicon.ico' })
        }
      }
      if (ev.event_type === 'leave' && ev.username) {
        lastEventIdRef.current = ev.id
        showToast(`${ev.username} went offline`)
      }
    }
  }, [appScope, me, showToast])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    void fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_scope: appScope, event_type: 'join' }),
    })
    void load()
    const poll = setInterval(() => {
      void load()
      void fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_scope: appScope, event_type: 'active' }),
      })
    }, 5000)
    return () => {
      clearInterval(poll)
      void fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_scope: appScope, event_type: 'leave' }),
      })
    }
  }, [appScope, load])

  const onlineUsernames = useMemo(() => {
    const now = Date.now()
    return new Set(
      staff
        .filter((s) => s.last_seen_at && now - new Date(s.last_seen_at).getTime() < ONLINE_MS)
        .map((s) => s.username),
    )
  }, [staff])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_scope: appScope, message: text.trim() }),
      })
      if (res.ok) {
        setText('')
        void load()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && (
        <div className="admin-chat-toast" role="status">
          {toast}
        </div>
      )}

      {open && (
        <div className="admin-chat-panel" role="dialog" aria-label="Admin live chat">
          <div className="admin-chat-panel-head">
            <strong>Staff chat ({appScope})</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className="admin-chat-presence">
            {staff.map((s) => (
              <span
                key={s.username}
                className={`admin-chat-presence-pill ${onlineUsernames.has(s.username) ? 'is-online' : ''}`}
              >
                {s.display_name || s.username}
              </span>
            ))}
          </div>

          <div className="admin-chat-messages">
            {messages.map((m) => (
              <div key={m.id} className="admin-chat-msg">
                <span className="admin-chat-msg-user">{m.username}</span>
                <span>{m.message}</span>
              </div>
            ))}
            {messages.length === 0 && <p className="admin-chat-empty">No messages yet.</p>}
          </div>

          <form className="admin-chat-form" onSubmit={sendMessage}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={me ? `Message as ${me}` : 'Type message'}
              maxLength={1000}
            />
            <button type="submit" disabled={loading || !text.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="admin-chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle admin live chat"
      >
        <MessageCircle size={22} />
      </button>

      <style jsx>{`
        .admin-chat-fab {
          position: fixed;
          right: 1rem;
          bottom: 1rem;
          z-index: 1200;
          width: 52px;
          height: 52px;
          border-radius: 999px;
          border: none;
          background: #10b981;
          color: #fff;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-chat-panel {
          position: fixed;
          right: 1rem;
          bottom: 4.5rem;
          width: 340px;
          max-height: 480px;
          z-index: 1200;
          background: #0a0a0a;
          border: 1px solid #222;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .admin-chat-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.65rem 0.85rem;
          border-bottom: 1px solid #1a1a1a;
          font-size: 0.85rem;
        }
        .admin-chat-panel-head button {
          background: transparent;
          border: none;
          color: #888;
          font-size: 1.25rem;
          cursor: pointer;
        }
        .admin-chat-presence {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #111;
        }
        .admin-chat-presence-pill {
          font-size: 0.68rem;
          padding: 0.2rem 0.45rem;
          border-radius: 999px;
          background: #1a1a1a;
          color: #666;
        }
        .admin-chat-presence-pill.is-online {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        .admin-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 0.6rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .admin-chat-msg {
          background: #111;
          border-radius: 8px;
          padding: 0.45rem 0.55rem;
          font-size: 0.82rem;
        }
        .admin-chat-msg-user {
          display: block;
          font-size: 0.7rem;
          color: #10b981;
          font-weight: 700;
        }
        .admin-chat-empty {
          color: #555;
          font-size: 0.8rem;
        }
        .admin-chat-form {
          display: flex;
          gap: 0.4rem;
          padding: 0.6rem;
          border-top: 1px solid #1a1a1a;
        }
        .admin-chat-form input {
          flex: 1;
          border-radius: 8px;
          border: 1px solid #222;
          background: #111;
          color: #fff;
          padding: 0.45rem 0.55rem;
          font-size: 0.8rem;
        }
        .admin-chat-form button {
          border: none;
          border-radius: 8px;
          background: #10b981;
          color: #fff;
          padding: 0.45rem 0.7rem;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .admin-chat-toast {
          position: fixed;
          right: 1rem;
          bottom: 5.5rem;
          z-index: 1201;
          background: #111827;
          color: #f9fafb;
          border: 1px solid #374151;
          border-radius: 10px;
          padding: 0.6rem 0.8rem;
          font-size: 0.8rem;
        }
        @media (max-width: 768px) {
          .admin-chat-fab {
            right: max(0.75rem, env(safe-area-inset-right, 0px));
            bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
          }
          .admin-chat-panel {
            left: max(0.75rem, env(safe-area-inset-left, 0px));
            right: max(0.75rem, env(safe-area-inset-right, 0px));
            width: auto;
            max-height: min(70dvh, 480px);
            bottom: calc(4.25rem + env(safe-area-inset-bottom, 0px));
          }
          .admin-chat-toast {
            left: max(0.75rem, env(safe-area-inset-left, 0px));
            right: max(0.75rem, env(safe-area-inset-right, 0px));
            bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </>
  )
}
