'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  DollarSign, Plus, Briefcase, TrendingUp, AlertTriangle, CheckCircle,
  Clock, XCircle, ChevronRight, Loader2, ExternalLink, Info, X, Tag,
  Banknote, Users, Star, Hourglass
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'

const CATEGORIES = ['design', 'writing', 'coding', 'tutoring', 'research', 'admin', 'marketing', 'video', 'photography', 'other']

const CATEGORY_COLORS: Record<string, string> = {
  design: '#8B5CF6', writing: '#3B82F6', coding: '#10B981', tutoring: '#F59E0B',
  research: '#EC4899', admin: '#6B7280', marketing: '#EF4444', video: '#F97316',
  photography: '#06B6D4', other: '#A3A3A3',
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#10B981' },
  assigned: { label: 'Assigned', color: '#3B82F6' },
  in_progress: { label: 'In Progress', color: '#F59E0B' },
  submitted: { label: 'Review', color: '#8B5CF6' },
  approved: { label: 'Approved', color: '#10B981' },
  paid: { label: 'Paid', color: '#10B981' },
  disputed: { label: 'Disputed', color: '#EF4444' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
}

interface Task {
  id: string; title: string; description: string; category: string
  payout_cents: number; net_payout_cents: number; platform_fee_cents: number
  status: string; deadline?: string; connection_only: boolean; created_at: string
  poster: { id: string; full_name: string; username?: string; avatar_url?: string }
  assignee?: { id: string; full_name: string; username?: string; avatar_url?: string }
}

type Tab = 'browse' | 'mine' | 'earnings'

function HustlePage() {
  const { profile } = useProfile()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('browse')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [connectStatus, setConnectStatus] = useState<{ status: string; payoutsEnabled?: boolean } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [earnings, setEarnings] = useState<{ total: number; pending: number } | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const fetchConnectStatus = useCallback(async () => {
    const res = await fetch('/api/hustle/connect')
    if (res.ok) setConnectStatus(await res.json())
  }, [])

  const fetchTasks = useCallback(async (t: Tab) => {
    setLoading(true)
    try {
      const params = t === 'mine' ? '?mine=1' : '?status=open'
      const res = await fetch(`/api/hustle/tasks${params}`)
      if (res.ok) {
        const { tasks: data } = await res.json()
        setTasks(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConnectStatus()
    // Check return from Stripe onboarding
    if (searchParams.get('success') === '1') {
      fetchConnectStatus()
    }
  }, [fetchConnectStatus, searchParams])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTasks(tab) }, [tab, fetchTasks])

  async function connectBank() {
    const res = await fetch('/api/hustle/connect', { method: 'POST' })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const isConnected = connectStatus?.payoutsEnabled === true

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 950, letterSpacing: '-0.04em', color: '#F3F4F6', margin: 0 }}>
          Side <span style={{ color: '#10B981' }}>Hustle</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0.4rem 0 0' }}>
          Post tasks, earn real money — platform keeps 10%
        </p>
      </div>

      {/* Policy banner */}
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <AlertTriangle size={15} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          <strong style={{ color: '#EF4444' }}>Platform Policy:</strong> espeezy.com keeps 10% of every transaction as a platform fee. Violations, fraud, or disputes may result in <strong>permanent account deactivation</strong> with no appeal.
        </p>
      </div>

      {/* Bank account connect banner */}
      {!isConnected && (
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Banknote size={22} color="#10B981" />
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem', color: '#F3F4F6' }}>Connect your bank to start earning</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                {connectStatus?.status === 'pending' ? 'Onboarding in progress — complete your Stripe setup' : 'Secure payouts via Stripe — no card stored on our end'}
              </p>
            </div>
          </div>
          <button onClick={connectBank} style={{
            background: '#10B981', border: 'none', borderRadius: '10px', color: '#000',
            fontWeight: 900, fontSize: '0.82rem', padding: '0.6rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            {connectStatus?.status === 'pending' ? 'Continue Setup' : 'Connect Bank'}
            <ExternalLink size={12} />
          </button>
        </div>
      )}

      {isConnected && (
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '0.65rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle size={15} color="#10B981" />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Bank account connected. Payouts enabled.</span>
        </div>
      )}

      {/* Tabs + Create button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px' }}>
          {(['browse', 'mine', 'earnings'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.45rem 1rem', borderRadius: '9px', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
              background: tab === t ? '#10B981' : 'transparent',
              color: tab === t ? '#000' : 'rgba(255,255,255,0.4)',
              textTransform: 'capitalize',
            }}>
              {t === 'browse' ? 'Browse Tasks' : t === 'mine' ? 'My Tasks' : 'Earnings'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ background: '#10B981', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 900, fontSize: '0.82rem', padding: '0.6rem 1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={14} /> Post a Task
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.2)' }}>
          <Briefcase size={36} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600 }}>{tab === 'browse' ? 'No open tasks yet. Post one!' : 'No tasks here yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} currentUserId={profile?.id ?? ''} fmt={fmt} onClick={() => setSelectedTask(task)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchTasks(tab) }} />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUserId={profile?.id ?? ''}
          isConnected={isConnected}
          fmt={fmt}
          onClose={() => setSelectedTask(null)}
          onRefresh={() => { fetchTasks(tab); setSelectedTask(null) }}
          onConnectBank={connectBank}
        />
      )}
    </div>
  )
}

function TaskCard({ task, currentUserId, fmt, onClick }: { task: Task; currentUserId: string; fmt: (c: number) => string; onClick: () => void }) {
  const isOwn = task.poster.id === currentUserId
  const meta = STATUS_META[task.status] ?? { label: task.status, color: '#6B7280' }

  return (
    <div onClick={onClick} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.1rem 1.25rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <span style={{ background: CATEGORY_COLORS[task.category] + '22', color: CATEGORY_COLORS[task.category], fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '5px' }}>{task.category}</span>
            {isOwn && <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '5px' }}>YOUR TASK</span>}
            <span style={{ background: meta.color + '22', color: meta.color, fontSize: '0.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: '5px' }}>{meta.label}</span>
          </div>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#F3F4F6' }}>{task.title}</h3>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 950, color: '#10B981', letterSpacing: '-0.03em' }}>{fmt(task.net_payout_cents)}</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>net after 10% fee</div>
          {task.deadline && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>Due {new Date(task.deadline).toLocaleDateString()}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#222', overflow: 'hidden', flexShrink: 0 }}>
          {task.poster.avatar_url ? <img src={task.poster.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.55rem', color: '#10B981', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{task.poster.full_name[0]}</span>}
        </div>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{task.poster.full_name}</span>
        {task.connection_only && <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '2px' }}><Users size={9} />Connections only</span>}
      </div>
    </div>
  )
}

function CreateTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'other', payout: '', deadline: '', connection_only: false })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    const payoutCents = Math.round(parseFloat(form.payout) * 100)
    if (!form.title.trim()) return setError('Title required')
    if (!form.description.trim()) return setError('Description required')
    if (isNaN(payoutCents) || payoutCents < 100 || payoutCents > 500000) return setError('Payout must be $1–$5,000')

    setSubmitting(true)
    try {
      const res = await fetch('/api/hustle/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          payout_cents: payoutCents,
          deadline: form.deadline || null,
          connection_only: form.connection_only,
        }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error ?? 'Failed to create task')
      onCreated()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 style={{ margin: '0 0 1.25rem', fontWeight: 950, letterSpacing: '-0.03em', fontSize: '1.2rem' }}>Post a Task</h2>
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#EF4444' }}>{error}</div>}
      <FormField label="Title">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What do you need done?" maxLength={100} style={inputStyle} />
      </FormField>
      <FormField label="Description">
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the task in detail…" rows={4} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <FormField label="Category">
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </FormField>
        <FormField label="Payout (USD)">
          <input value={form.payout} onChange={e => setForm(f => ({ ...f, payout: e.target.value }))} placeholder="e.g. 25.00" type="number" min="1" max="5000" step="0.01" style={inputStyle} />
        </FormField>
      </div>
      <FormField label="Deadline (optional)">
        <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date" style={inputStyle} />
      </FormField>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', cursor: 'pointer', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
        <input type="checkbox" checked={form.connection_only} onChange={e => setForm(f => ({ ...f, connection_only: e.target.checked }))} style={{ accentColor: '#10B981' }} />
        Connections only (restrict visibility to your network)
      </label>
      {form.payout && !isNaN(parseFloat(form.payout)) && (
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Gross payout</span><span style={{ color: '#F3F4F6', fontWeight: 700 }}>${parseFloat(form.payout).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Platform fee (10%)</span><span style={{ color: '#EF4444', fontWeight: 700 }}>-${(parseFloat(form.payout) * 0.10).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}><span style={{ color: '#10B981', fontWeight: 800 }}>Worker receives</span><span style={{ color: '#10B981', fontWeight: 900 }}>${(parseFloat(form.payout) * 0.90).toFixed(2)}</span></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ ...btnSecondary }}>Cancel</button>
        <button onClick={submit} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? <Loader2 size={13} style={{ display: 'inline' }} /> : null} Post Task
        </button>
      </div>
    </ModalOverlay>
  )
}

function TaskDetailModal({ task, currentUserId, isConnected, fmt, onClose, onRefresh, onConnectBank }: {
  task: Task; currentUserId: string; isConnected: boolean; fmt: (c: number) => string
  onClose: () => void; onRefresh: () => void; onConnectBank: () => void
}) {
  const isOwn = task.poster.id === currentUserId
  const isAssignee = task.assignee?.id === currentUserId
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [submissionNote, setSubmissionNote] = useState('')

  async function apply() {
    if (!isConnected) { onConnectBank(); return }
    setApplying(true); setError('')
    try {
      const res = await fetch(`/api/hustle/tasks/${task.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setApplied(true)
    } finally { setApplying(false) }
  }

  async function doAction(action: string, extra?: object) {
    setActionLoading(true); setError('')
    try {
      const res = await fetch(`/api/hustle/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Action failed'); return }
      onRefresh()
    } finally { setActionLoading(false) }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <span style={{ background: CATEGORY_COLORS[task.category] + '22', color: CATEGORY_COLORS[task.category], fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '5px' }}>{task.category}</span>
        <span style={{ background: (STATUS_META[task.status]?.color ?? '#6B7280') + '22', color: STATUS_META[task.status]?.color ?? '#6B7280', fontSize: '0.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: '5px' }}>{STATUS_META[task.status]?.label ?? task.status}</span>
      </div>
      <h2 style={{ margin: '0 0 0.5rem', fontWeight: 950, letterSpacing: '-0.03em', fontSize: '1.2rem', color: '#F3F4F6' }}>{task.title}</h2>
      <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{task.description}</p>
      <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>Total payout</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F3F4F6' }}>{fmt(task.payout_cents)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>Platform fee (10%)</span>
          <span style={{ fontSize: '0.8rem', color: '#EF4444' }}>-{fmt(task.platform_fee_cents)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10B981' }}>You earn</span>
          <span style={{ fontSize: '1rem', fontWeight: 950, color: '#10B981' }}>{fmt(task.net_payout_cents)}</span>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#EF4444' }}>{error}</div>}

      {/* Action area */}
      {!isOwn && !isAssignee && task.status === 'open' && !applied && (
        <div>
          {!isConnected && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.65rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
              ⚠️ You need to connect a bank account before applying.
            </div>
          )}
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Why are you a good fit? (optional)" rows={2} maxLength={500} style={{ ...inputStyle, marginBottom: '0.75rem', resize: 'none' }} />
          <button onClick={apply} disabled={applying} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
            {applying ? <Loader2 size={13} style={{ display: 'inline' }} /> : null}
            {isConnected ? 'Apply for Task' : 'Connect Bank & Apply'}
          </button>
        </div>
      )}
      {applied && <div style={{ textAlign: 'center', color: '#10B981', fontWeight: 800, padding: '0.75rem' }}>✓ Application submitted!</div>}
      {isAssignee && task.status === 'in_progress' && (
        <div>
          <textarea value={submissionNote} onChange={e => setSubmissionNote(e.target.value)} placeholder="Describe what you completed…" rows={2} maxLength={1000} style={{ ...inputStyle, marginBottom: '0.75rem', resize: 'none' }} />
          <button onClick={() => doAction('submit', { submission_note: submissionNote })} disabled={actionLoading} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
            Submit Work for Review
          </button>
        </div>
      )}
      {isOwn && task.status === 'submitted' && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => doAction('approve')} disabled={actionLoading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
            {actionLoading ? <Loader2 size={13} style={{ display: 'inline' }} /> : null} Approve & Pay
          </button>
        </div>
      )}
      {isOwn && ['open', 'assigned'].includes(task.status) && (
        <button onClick={() => doAction('cancel')} disabled={actionLoading} style={{ ...btnDanger, width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
          Cancel Task
        </button>
      )}
      <button onClick={onClose} style={{ ...btnSecondary, width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}>Close</button>
    </ModalOverlay>
  )
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', padding: '0.6rem 0.85rem', color: '#F3F4F6', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
}
const btnPrimary: React.CSSProperties = {
  background: '#10B981', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 900, fontSize: '0.85rem',
  padding: '0.65rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
}
const btnSecondary: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)',
  fontWeight: 700, fontSize: '0.85rem', padding: '0.65rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
}
const btnDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#EF4444',
  fontWeight: 700, fontSize: '0.85rem', padding: '0.65rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
}

// Wrap in Suspense for useSearchParams
export default function HustlePageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}><Loader2 size={24} /></div>}>
      <HustlePage />
    </Suspense>
  )
}
