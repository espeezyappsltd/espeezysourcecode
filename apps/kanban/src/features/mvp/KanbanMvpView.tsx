'use client'

import type { User } from '@supabase/supabase-js'
import { Activity, AlertCircle, ArrowLeft, ArrowRight, Download, Plus, Users, Wifi, WifiOff, Zap } from 'lucide-react'
import { COL_CONFIG, COLUMN_ORDER, MAX_USERS, PRIORITY_CONFIG } from './config'
import { Tooltip } from './Tooltip'
import type { AnalyticsEvent, AnalyticsSummary, Card, Column, PresenceUser, Priority, SocketStatus } from './types'
import { avatarColor, initials, relativeTime } from './utils'

type KanbanMvpViewProps = {
  analytics: AnalyticsSummary[]
  cards: Card[]
  columns: Array<{
    key: Column
    cards: Card[]
    config: (typeof COL_CONFIG)[Column]
  }>
  createTask: () => void
  currentTime: number
  donePercent: number
  downloadReport: () => void
  events: AnalyticsEvent[]
  joinError: string
  maxActions: number
  moveCard: (cardId: string, nextColumn: Column) => void
  newPriority: Priority
  newTask: string
  presenceCount: number
  presenceUsers: PresenceUser[]
  setNewPriority: (value: Priority) => void
  setNewTask: (value: string) => void
  socketStatus: SocketStatus
  totalCards: number
  user: User | null
}

function HeaderSection({
  presenceCount,
  presenceUsers,
  socketStatus,
  totalCards,
  donePercent,
  user,
}: Pick<KanbanMvpViewProps, 'presenceCount' | 'presenceUsers' | 'socketStatus' | 'totalCards' | 'donePercent' | 'user'>) {
  const displayUsers = presenceUsers.length > 0 ? presenceUsers : user ? [{ userId: user.id, email: user.email ?? '' }] : []

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#059669,#10b981)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={18} color="white" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>Espeezy Kanban</h1>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MVP · Public Room</span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>Realtime collaboration · {totalCards} card{totalCards !== 1 ? 's' : ''} · {donePercent}% complete</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {displayUsers.slice(0, 5).map((presenceUser, index) => (
            <Tooltip key={presenceUser.userId} tip={presenceUser.email}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: avatarColor(presenceUser.email),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: 'white',
                  border: '2px solid #080f1e',
                  marginLeft: index === 0 ? 0 : '-8px',
                  cursor: 'default',
                }}
              >
                {initials(presenceUser.email)}
              </div>
            </Tooltip>
          ))}
          {presenceCount > 5 && <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '4px' }}>+{presenceCount - 5}</span>}
        </div>

        <Tooltip tip={socketStatus === 'open' ? 'Realtime connected via WebSocket' : 'WebSocket disconnected — attempting reconnect'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.7rem', borderRadius: '8px', background: socketStatus === 'open' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)', border: `1px solid ${socketStatus === 'open' ? 'rgba(16,185,129,0.3)' : 'rgba(249,115,22,0.3)'}`, cursor: 'default' }}>
            {socketStatus === 'open' ? <Wifi size={13} color="#10b981" /> : <WifiOff size={13} color="#f97316" />}
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: socketStatus === 'open' ? '#10b981' : '#f97316' }}>
              {socketStatus === 'open' ? 'Live' : 'Reconnecting'}
            </span>
          </div>
        </Tooltip>

        <Tooltip tip={`${presenceCount} of ${MAX_USERS} slots used in this room`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.7rem', borderRadius: '8px', background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.15)', cursor: 'default' }}>
            <Users size={13} color="#94a3b8" />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: presenceCount >= MAX_USERS ? '#fca5a5' : '#94a3b8' }}>{presenceCount}/{MAX_USERS}</span>
          </div>
        </Tooltip>
      </div>
    </header>
  )
}

function ToolbarSection({
  createTask,
  downloadReport,
  newPriority,
  newTask,
  presenceCount,
  setNewPriority,
  setNewTask,
}: Pick<KanbanMvpViewProps, 'createTask' | 'downloadReport' | 'newPriority' | 'newTask' | 'presenceCount' | 'setNewPriority' | 'setNewTask'>) {
  const roomIsFull = presenceCount > MAX_USERS

  return (
    <section style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '12px', padding: '0.75rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        value={newTask}
        onChange={(event) => {
          setNewTask(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            createTask()
          }
        }}
        placeholder="Add a task… (Enter to submit)"
        style={{ flex: '1 1 220px', minWidth: '200px', background: 'rgba(8,15,30,0.8)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '9px', color: '#f8fafc', padding: '0.6rem 0.85rem', fontSize: '0.88rem', outline: 'none' }}
      />

      <div style={{ display: 'flex', gap: '0.3rem' }}>
        {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((priority) => (
          <Tooltip key={priority} tip={`Priority: ${PRIORITY_CONFIG[priority].label}`}>
            <button
              type="button"
              onClick={() => {
                setNewPriority(priority)
              }}
              style={{
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: `1px solid ${newPriority === priority ? PRIORITY_CONFIG[priority].color : 'rgba(148,163,184,0.15)'}`,
                background: newPriority === priority ? PRIORITY_CONFIG[priority].bg : 'transparent',
                color: newPriority === priority ? PRIORITY_CONFIG[priority].color : '#64748b',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {PRIORITY_CONFIG[priority].label}
            </button>
          </Tooltip>
        ))}
      </div>

      <Tooltip tip={roomIsFull ? 'Room is full' : 'Add card (or press Enter)'}>
        <button
          type="button"
          onClick={createTask}
          disabled={roomIsFull || !newTask.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            border: 'none',
            borderRadius: '9px',
            background: newTask.trim() ? 'linear-gradient(135deg,#059669,#10b981)' : 'rgba(148,163,184,0.1)',
            color: newTask.trim() ? '#fff' : '#475569',
            fontWeight: 700,
            padding: '0.6rem 1rem',
            cursor: newTask.trim() ? 'pointer' : 'default',
            fontSize: '0.88rem',
            transition: 'all 0.15s',
          }}
        >
          <Plus size={15} /> Add Card
        </button>
      </Tooltip>

      <Tooltip tip="Download contribution report as CSV">
        <button
          type="button"
          onClick={downloadReport}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '9px', background: 'transparent', color: '#94a3b8', fontWeight: 600, padding: '0.6rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem' }}
        >
          <Download size={14} /> Export CSV
        </button>
      </Tooltip>
    </section>
  )
}

function CardList({
  cards,
  currentTime,
  moveCard,
  presenceCount,
}: {
  cards: Card[]
  currentTime: number
  moveCard: (cardId: string, nextColumn: Column) => void
  presenceCount: number
}) {
  return (
    <>
      {cards.map((card) => {
        const priority = PRIORITY_CONFIG[card.priority ?? 'medium']
        const columnIndex = COLUMN_ORDER.indexOf(card.column)
        const previousColumn = columnIndex > 0 ? COLUMN_ORDER[columnIndex - 1] : null
        const nextColumn = columnIndex < COLUMN_ORDER.length - 1 ? COLUMN_ORDER[columnIndex + 1] : null
        const creator = card.createdBy ?? card.updatedBy

        return (
          <div key={card.id} style={{ background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '10px', padding: '0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Tooltip tip={`Priority: ${priority.label}`}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '5px', background: priority.bg, color: priority.color, whiteSpace: 'nowrap', cursor: 'default', flexShrink: 0 }}>
                  {priority.icon} {priority.label}
                </span>
              </Tooltip>
              <strong style={{ display: 'block', color: '#f1f5f9', fontSize: '0.85rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{card.title}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <Tooltip tip={creator}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: avatarColor(creator), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: 'white', cursor: 'default', flexShrink: 0 }}>
                  {initials(creator)}
                </div>
              </Tooltip>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{creator.split('@')[0]}</span>
              <span style={{ fontSize: '0.65rem', color: '#475569', marginLeft: 'auto' }}>{relativeTime(card.updatedAt, currentTime)}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {previousColumn && (
                <Tooltip tip={`Move to ${COL_CONFIG[previousColumn].title}`}>
                  <button
                    type="button"
                    onClick={() => {
                      moveCard(card.id, previousColumn)
                    }}
                    disabled={presenceCount > MAX_USERS}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '7px', background: 'transparent', color: '#64748b', fontSize: '0.7rem', padding: '0.3rem 0.5rem', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={11} /> {COL_CONFIG[previousColumn].title}
                  </button>
                </Tooltip>
              )}
              {nextColumn && (
                <Tooltip tip={`Move to ${COL_CONFIG[nextColumn].title}`}>
                  <button
                    type="button"
                    onClick={() => {
                      moveCard(card.id, nextColumn)
                    }}
                    disabled={presenceCount > MAX_USERS}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: `1px solid ${COL_CONFIG[nextColumn].accent}40`, borderRadius: '7px', background: COL_CONFIG[nextColumn].dimAccent, color: COL_CONFIG[nextColumn].accent, fontSize: '0.7rem', fontWeight: 600, padding: '0.3rem 0.5rem', cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    {COL_CONFIG[nextColumn].title} <ArrowRight size={11} />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

function BoardSection({
  columns,
  currentTime,
  moveCard,
  presenceCount,
}: Pick<KanbanMvpViewProps, 'columns' | 'currentTime' | 'moveCard' | 'presenceCount'>) {
  return (
    <section style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      {columns.map(({ cards, config, key }) => (
        <article key={key} style={{ background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)', borderTop: `3px solid ${config.accent}`, borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: config.accent }}>{config.icon}</span>
              <h2 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>{config.title}</h2>
            </div>
            <Tooltip tip={`${cards.length} card${cards.length !== 1 ? 's' : ''} in ${config.title}`}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: config.dimAccent, color: config.accent, cursor: 'default' }}>
                {cards.length}
              </span>
            </Tooltip>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <CardList cards={cards} currentTime={currentTime} moveCard={moveCard} presenceCount={presenceCount} />
            {cards.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#334155' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.35rem', opacity: 0.4 }}>{config.emptyIcon}</div>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>No cards yet</p>
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}

function InsightsSection({
  analytics,
  cards,
  currentTime,
  events,
  maxActions,
}: Pick<KanbanMvpViewProps, 'analytics' | 'cards' | 'currentTime' | 'events' | 'maxActions'>) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
      <section style={{ background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '12px', padding: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Activity size={15} color="#10b981" />
          <h2 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>Contribution Analytics</h2>
          <Tooltip tip="Actions per user since session start. Download CSV for full export.">
            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '5px', background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', cursor: 'default', border: '1px solid rgba(16,185,129,0.2)' }}>?</span>
          </Tooltip>
        </div>
        {analytics.length === 0 ? (
          <p style={{ margin: 0, color: '#334155', fontSize: '0.82rem', textAlign: 'center', padding: '1rem 0' }}>No activity yet — create or move a card to start tracking.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {analytics.map((item) => (
              <div key={item.userId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: avatarColor(item.email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'white' }}>
                      {initials(item.email)}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{item.email.split('@')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Tooltip tip={`${item.created} card${item.created !== 1 ? 's' : ''} created`}>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', cursor: 'default' }}>+{item.created}</span>
                    </Tooltip>
                    <Tooltip tip={`${item.moved} card${item.moved !== 1 ? 's' : ''} moved`}>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', cursor: 'default' }}>↔ {item.moved}</span>
                    </Tooltip>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.total} total</span>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'rgba(148,163,184,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(item.total / maxActions) * 100}%`, background: `linear-gradient(90deg, ${avatarColor(item.email)}, ${avatarColor(item.email)}aa)`, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '12px', padding: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Zap size={15} color="#f59e0b" />
          <h2 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>Live Activity</h2>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>last {Math.min(events.length, 12)} events</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '260px', overflowY: 'auto' }}>
          {events.slice(0, 12).map((event, index) => {
            const icon = event.action === 'card_created' ? '✦' : event.action === 'card_moved' ? '→' : '⊕'
            const iconColor = event.action === 'card_created' ? '#10b981' : event.action === 'card_moved' ? '#059669' : '#f59e0b'
            const label = event.action === 'card_created'
              ? 'created a card'
              : event.action === 'card_moved'
                ? `moved card → ${event.toColumn ? COL_CONFIG[event.toColumn].title : '?'}`
                : 'joined the room'
            const cardTitle = event.cardId ? cards.find((card) => card.id === event.cardId)?.title : undefined

            return (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ color: iconColor, fontSize: '0.75rem', flexShrink: 0, paddingTop: '1px', fontWeight: 700 }}>{icon}</span>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{event.email.split('@')[0]}</span>
                    {' '}
                    {label}
                    {cardTitle && <span style={{ color: '#64748b' }}> &ldquo;{cardTitle.slice(0, 28)}{cardTitle.length > 28 ? '…' : ''}&rdquo;</span>}
                  </span>
                  <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '1px' }}>{relativeTime(event.at, currentTime)}</div>
                </div>
              </div>
            )
          })}
          {events.length === 0 && <p style={{ margin: 0, color: '#334155', fontSize: '0.78rem', textAlign: 'center', padding: '1rem 0' }}>Waiting for activity…</p>}
        </div>
      </section>
    </div>
  )
}

export function KanbanMvpView(props: KanbanMvpViewProps) {
  return (
    <main style={{ minHeight: '100vh', background: '#080f1e', color: '#e2e8f0', padding: '1rem 1.25rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <HeaderSection
          donePercent={props.donePercent}
          presenceCount={props.presenceCount}
          presenceUsers={props.presenceUsers}
          socketStatus={props.socketStatus}
          totalCards={props.totalCards}
          user={props.user}
        />

        <div style={{ height: '4px', background: 'rgba(148,163,184,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${props.donePercent}%`, background: 'linear-gradient(90deg,#059669,#10b981)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>

        {props.joinError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(127,29,29,0.3)', borderRadius: '10px', padding: '0.7rem 1rem' }}>
            <AlertCircle size={16} color="#fca5a5" />
            <span style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{props.joinError}</span>
          </div>
        )}

        <ToolbarSection
          createTask={props.createTask}
          downloadReport={props.downloadReport}
          newPriority={props.newPriority}
          newTask={props.newTask}
          presenceCount={props.presenceCount}
          setNewPriority={props.setNewPriority}
          setNewTask={props.setNewTask}
        />

        <BoardSection
          columns={props.columns}
          currentTime={props.currentTime}
          moveCard={props.moveCard}
          presenceCount={props.presenceCount}
        />

        <InsightsSection
          analytics={props.analytics}
          cards={props.cards}
          currentTime={props.currentTime}
          events={props.events}
          maxActions={props.maxActions}
        />
      </div>
    </main>
  )
}
