'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, ChevronDown } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m the espeezy.com support assistant. How can I help you today? 👋' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      if (res.ok) {
        const { reply } = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again or contact support@espeezy.com.' }])
      }
    } finally {
      setLoading(false)
    }
  }

  async function escalate() {
    setEscalated(true)
    // Create support ticket
    await fetch('/api/support/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: messages.map(m => `${m.role}: ${m.content}`).join('\n').slice(0, 2000) }),
    }).catch(() => {})
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'I\'ve created a support ticket and a human agent will get back to you within 24 hours. You can also email support@espeezy.com directly.'
    }])
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 'calc(var(--h-mobile-bottom, 64px) + 1rem)', right: '1.25rem',
          width: 52, height: 52, borderRadius: '50%', background: '#10B981', border: 'none',
          cursor: 'pointer', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)', transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label="Open support chat"
      >
        {open ? <X size={20} color="#000" /> : <MessageCircle size={20} color="#000" />}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 'calc(var(--h-mobile-bottom, 64px) + 4.5rem)', right: '1.25rem',
          width: 'min(360px, calc(100vw - 2rem))', height: 420,
          background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column', zIndex: 3000,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.08)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '0.88rem', color: '#F3F4F6' }}>espeezy.com Support</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#10B981' }}>● AI-powered · usually instant</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '0.55rem 0.85rem', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? '#10B981' : 'rgba(255,255,255,0.06)',
                  color: m.role === 'user' ? '#000' : '#E5E7EB',
                  fontSize: '0.82rem', lineHeight: 1.55, fontWeight: m.role === 'user' ? 700 : 400,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.55rem 0.85rem', borderRadius: '14px 14px 14px 4px' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.4)' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Escalate */}
          {!escalated && messages.length >= 3 && (
            <div style={{ padding: '0 1rem 0.5rem', textAlign: 'center' }}>
              <button onClick={escalate} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}>
                Talk to a Human →
              </button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }}}
              placeholder="Type your question…"
              disabled={loading}
              maxLength={500}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.5rem 0.75rem', color: '#F3F4F6', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{ background: input.trim() && !loading ? '#10B981' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Send size={14} color={input.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)'} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
