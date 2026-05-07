'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Download, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

type Column = 'todo' | 'in_progress' | 'done'

type Card = {
  id: string
  title: string
  column: Column
  updatedBy: string
  updatedAt: number
}

type AnalyticsEvent = {
  at: number
  userId: string
  email: string
  action: 'card_created' | 'card_moved' | 'user_joined'
  cardId?: string
}

type WsMessage =
  | { type: 'join'; roomId: string; userId: string; email: string }
  | { type: 'sync_state'; cards: Card[]; events: AnalyticsEvent[] }
  | { type: 'presence'; count: number; users?: Array<{ userId: string; email: string }> }
  | { type: 'card_created'; card: Card; actor: { userId: string; email: string } }
  | { type: 'card_moved'; cardId: string; column: Column; actor: { userId: string; email: string }; at: number }
  | { type: 'error'; code: string; message: string }

const ROOM_ID = 'kanban-mvp'
const MAX_USERS = 10

function toCsvLine(values: string[]) {
  return values.map(v => `"${v.replace(/"/g, '""')}"`).join(',')
}

export default function KanbanMvpPage() {
  const [user, setUser] = useState<User | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [newTask, setNewTask] = useState('')
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [presenceCount, setPresenceCount] = useState(1)
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')
  const [joinError, setJoinError] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const cardCounter = useRef(1)

  useEffect(() => {
    let active = true

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      if (!data.user) {
        window.location.href = '/'
        return
      }
      setUser(data.user)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        window.location.href = '/'
        return
      }
      setUser(session.user)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const wsUrl = process.env.NEXT_PUBLIC_ESPEEZY_WS_URL ?? 'wss://espeezyserver.espeezy.com/ws'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    setSocketStatus('connecting')
    setJoinError('')

    ws.onopen = () => {
      setSocketStatus('open')
      const joinMessage: WsMessage = {
        type: 'join',
        roomId: ROOM_ID,
        userId: user.id,
        email: user.email ?? 'unknown@espeezy.com',
      }
      ws.send(JSON.stringify(joinMessage))
      setEvents(prev => [{ at: Date.now(), userId: user.id, email: user.email ?? 'unknown@espeezy.com', action: 'user_joined' }, ...prev])
    }

    ws.onmessage = (ev) => {
      let message: WsMessage | null = null
      try {
        message = JSON.parse(ev.data) as WsMessage
      } catch {
        return
      }

      if (!message) return

      if (message.type === 'sync_state') {
        setCards(message.cards ?? [])
        setEvents(message.events ?? [])
        return
      }

      if (message.type === 'presence') {
        setPresenceCount(message.count)
        if (message.count > MAX_USERS) {
          setJoinError('Room is full. MVP supports up to 10 concurrent users.')
        }
        return
      }

      if (message.type === 'card_created') {
        setCards(prev => {
          const exists = prev.some(card => card.id === message.card.id)
          if (exists) return prev
          return [message.card, ...prev]
        })
        setEvents(prev => [
          {
            at: message.card.updatedAt,
            userId: message.actor.userId,
            email: message.actor.email,
            action: 'card_created',
            cardId: message.card.id,
          },
          ...prev,
        ])
        return
      }

      if (message.type === 'card_moved') {
        setCards(prev => prev.map(card => (
          card.id === message.cardId
            ? { ...card, column: message.column, updatedBy: message.actor.email, updatedAt: message.at }
            : card
        )))
        setEvents(prev => [
          {
            at: message.at,
            userId: message.actor.userId,
            email: message.actor.email,
            action: 'card_moved',
            cardId: message.cardId,
          },
          ...prev,
        ])
        return
      }

      if (message.type === 'error') {
        setJoinError(message.message)
      }
    }

    ws.onclose = () => {
      setSocketStatus('closed')
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [user])

  const analytics = useMemo(() => {
    const perUser = new Map<string, { email: string; created: number; moved: number; total: number }>()

    for (const event of events) {
      const current = perUser.get(event.userId) ?? { email: event.email, created: 0, moved: 0, total: 0 }
      if (event.action === 'card_created') current.created += 1
      if (event.action === 'card_moved') current.moved += 1
      current.total += 1
      perUser.set(event.userId, current)
    }

    return Array.from(perUser.entries()).map(([userId, value]) => ({ userId, ...value }))
      .sort((a, b) => b.total - a.total)
  }, [events])

  function sendWs(message: WsMessage) {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(message))
    return true
  }

  function createTask() {
    if (!user || !newTask.trim() || presenceCount > MAX_USERS) return

    const card: Card = {
      id: `card-${Date.now()}-${cardCounter.current++}`,
      title: newTask.trim(),
      column: 'todo',
      updatedBy: user.email ?? 'unknown@espeezy.com',
      updatedAt: Date.now(),
    }

    const ok = sendWs({ type: 'card_created', card, actor: { userId: user.id, email: user.email ?? 'unknown@espeezy.com' } })
    if (!ok) return

    setCards(prev => [card, ...prev])
    setEvents(prev => [{ at: card.updatedAt, userId: user.id, email: user.email ?? 'unknown@espeezy.com', action: 'card_created', cardId: card.id }, ...prev])
    setNewTask('')
  }

  function moveCard(cardId: string, nextColumn: Column) {
    if (!user || presenceCount > MAX_USERS) return

    const at = Date.now()
    const ok = sendWs({
      type: 'card_moved',
      cardId,
      column: nextColumn,
      actor: { userId: user.id, email: user.email ?? 'unknown@espeezy.com' },
      at,
    })
    if (!ok) return

    setCards(prev => prev.map(card => (
      card.id === cardId
        ? { ...card, column: nextColumn, updatedBy: user.email ?? 'unknown@espeezy.com', updatedAt: at }
        : card
    )))
    setEvents(prev => [{ at, userId: user.id, email: user.email ?? 'unknown@espeezy.com', action: 'card_moved', cardId }, ...prev])
  }

  function downloadReport() {
    const rows = [
      toCsvLine(['user_id', 'email', 'cards_created', 'cards_moved', 'total_actions']),
      ...analytics.map(item => toCsvLine([
        item.userId,
        item.email,
        String(item.created),
        String(item.moved),
        String(item.total),
      ])),
    ]

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanban-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const todoCards = cards.filter(card => card.column === 'todo')
  const inProgressCards = cards.filter(card => card.column === 'in_progress')
  const doneCards = cards.filter(card => card.column === 'done')

  return (
    <main style={{ minHeight: '100vh', background: '#0b1220', color: '#e2e8f0', padding: '1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#f8fafc' }}>Kanban MVP</h1>
            <p style={{ margin: '0.4rem 0 0', color: '#94a3b8' }}>Realtime collaboration with analytics and report downloads.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {socketStatus === 'open' ? <Wifi size={18} color="#10b981" /> : <WifiOff size={18} color="#f97316" />}
            <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              {socketStatus === 'open' ? 'Realtime connected' : 'Realtime reconnecting'}
            </span>
            <span style={{
              padding: '0.25rem 0.55rem',
              borderRadius: '999px',
              background: presenceCount > MAX_USERS ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
              color: presenceCount > MAX_USERS ? '#fecaca' : '#bbf7d0',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {presenceCount}/{MAX_USERS} users
            </span>
          </div>
        </header>

        {joinError ? (
          <div style={{ border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(127,29,29,0.35)', borderRadius: '10px', padding: '0.75rem' }}>
            {joinError}
          </div>
        ) : null}

        <section style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', padding: '0.85rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task..."
            style={{
              flex: '1 1 240px',
              minWidth: '220px',
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(148,163,184,0.35)',
              borderRadius: '10px',
              color: '#f8fafc',
              padding: '0.65rem 0.75rem',
            }}
          />
          <button
            type="button"
            onClick={createTask}
            disabled={presenceCount > MAX_USERS}
            style={{
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #10b981)',
              color: '#fff',
              fontWeight: 700,
              padding: '0.65rem 0.9rem',
              cursor: 'pointer',
            }}
          >
            Add Card
          </button>
          <button
            type="button"
            onClick={downloadReport}
            style={{
              border: '1px solid rgba(148,163,184,0.4)',
              borderRadius: '10px',
              background: 'transparent',
              color: '#e2e8f0',
              fontWeight: 700,
              padding: '0.65rem 0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Download size={16} /> Download Analytics CSV
          </button>
        </section>

        <section style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {[
            { key: 'todo' as const, title: 'To Do', cards: todoCards },
            { key: 'in_progress' as const, title: 'In Progress', cards: inProgressCards },
            { key: 'done' as const, title: 'Done', cards: doneCards },
          ].map(col => (
            <article key={col.key} style={{ background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', padding: '0.75rem' }}>
              <h2 style={{ margin: '0 0 0.55rem', fontSize: '1rem', color: '#f8fafc' }}>{col.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {col.cards.map(card => (
                  <div key={card.id} style={{ background: 'rgba(30,41,59,0.85)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '10px', padding: '0.6rem' }}>
                    <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '0.4rem' }}>{card.title}</strong>
                    <small style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      Updated by {card.updatedBy}
                    </small>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {(['todo', 'in_progress', 'done'] as const).map(next => (
                        <button
                          key={next}
                          type="button"
                          disabled={next === card.column || presenceCount > MAX_USERS}
                          onClick={() => moveCard(card.id, next)}
                          style={{
                            border: '1px solid rgba(148,163,184,0.3)',
                            borderRadius: '8px',
                            background: next === card.column ? 'rgba(99,102,241,0.25)' : 'transparent',
                            color: '#e2e8f0',
                            fontSize: '0.72rem',
                            padding: '0.3rem 0.45rem',
                            cursor: 'pointer',
                          }}
                        >
                          {next === 'todo' ? 'To Do' : next === 'in_progress' ? 'In Progress' : 'Done'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {col.cards.length === 0 ? <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>No cards yet.</p> : null}
              </div>
            </article>
          ))}
        </section>

        <section style={{ background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', padding: '0.8rem' }}>
          <h2 style={{ margin: '0 0 0.6rem', fontSize: '1rem', color: '#f8fafc' }}>Live Analytics</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.78rem', padding: '0.45rem' }}>User</th>
                  <th style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.78rem', padding: '0.45rem' }}>Cards Created</th>
                  <th style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.78rem', padding: '0.45rem' }}>Cards Moved</th>
                  <th style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.78rem', padding: '0.45rem' }}>Total Actions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map(item => (
                  <tr key={item.userId}>
                    <td style={{ padding: '0.45rem', borderTop: '1px solid rgba(148,163,184,0.16)', color: '#e2e8f0' }}>{item.email}</td>
                    <td style={{ padding: '0.45rem', borderTop: '1px solid rgba(148,163,184,0.16)', color: '#e2e8f0' }}>{item.created}</td>
                    <td style={{ padding: '0.45rem', borderTop: '1px solid rgba(148,163,184,0.16)', color: '#e2e8f0' }}>{item.moved}</td>
                    <td style={{ padding: '0.45rem', borderTop: '1px solid rgba(148,163,184,0.16)', color: '#e2e8f0' }}>{item.total}</td>
                  </tr>
                ))}
                {analytics.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '0.55rem', color: '#64748b' }}>No activity yet. Create or move a card to start tracking.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
