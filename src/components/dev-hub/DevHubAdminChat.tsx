'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useDevHubAdminSession } from './DevHubAdminSessionContext'

type ChatMessage = { id: string; username: string; message: string }

export function DevHubAdminChat() {
  const { member } = useDevHubAdminSession()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const lastEventRef = useRef('')

  const load = useCallback(async () => {
    const res = await fetch('/api/hub/chat/messages', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setMessages(data.messages ?? [])
    for (const ev of data.events ?? []) {
      if (!ev.id || ev.id === lastEventRef.current) continue
      lastEventRef.current = ev.id
      if (ev.event_type === 'join' && ev.username !== member?.username) {
        setToast(`${ev.username} is online`)
        setTimeout(() => setToast(null), 4000)
      }
      if (ev.event_type === 'leave') {
        setToast(`${ev.username} went offline`)
        setTimeout(() => setToast(null), 4000)
      }
    }
  }, [member?.username])

  useEffect(() => {
    if (!member) return
    void fetch('/api/hub/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'join' }),
    })
    void load()
    const poll = setInterval(() => {
      void load()
      void fetch('/api/hub/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'active' }),
      })
    }, 5000)
    return () => {
      clearInterval(poll)
      void fetch('/api/hub/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'leave' }),
      })
    }
  }, [member, load])

  if (!member) return null

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const res = await fetch('/api/hub/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text.trim() }),
    })
    if (res.ok) {
      setText('')
      void load()
    }
  }

  return (
    <>
      {toast && <div className="dev-hub-admin-chat-toast">{toast}</div>}
      {open && (
        <div className="dev-hub-admin-chat-panel">
          <div className="dev-hub-admin-chat-head">
            <strong>Staff chat</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>
          <div className="dev-hub-admin-chat-msgs">
            {messages.map((m) => (
              <div key={m.id} className="dev-hub-admin-chat-msg">
                <span className="dev-hub-admin-chat-user">{m.username}</span>
                {m.message}
              </div>
            ))}
          </div>
          <form className="dev-hub-admin-chat-form" onSubmit={send}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message as ${member.username}`} maxLength={1000} />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
      <button type="button" className="dev-hub-admin-chat-fab" onClick={() => setOpen((v) => !v)} aria-label="Staff chat">
        <MessageCircle size={20} />
      </button>
    </>
  )
}
