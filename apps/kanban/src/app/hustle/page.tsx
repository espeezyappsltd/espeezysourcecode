'use client'

import { useProfile } from '@/context/ProfileContext'
import { motion, AnimatePresence } from 'framer-motion'

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.05em', color: '#F3F4F6', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase size={32} className="text-brand" style={{ color: '#10B981' }} />
          Side <span style={{ color: '#10B981' }}>Hustle</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', margin: '0.5rem 0 0', fontWeight: 500 }}>
          High-performance task marketplace  —  Keep <span style={{ color: '#10B981', fontWeight: 700 }}>90%</span> of your earnings
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
                {connectStatus?.status === 'pending' ? 'Onboarding in progress  -  complete your Stripe setup' : 'Secure payouts via Stripe  -  no card stored on our end'}
              </p>
            </div>
          </div>
          <button 
            onClick={connectBank} 
            aria-label={connectStatus?.status === 'pending' ? 'Continue Stripe bank account setup' : 'Connect bank account via Stripe'}
            style={{
              background: '#10B981', border: 'none', borderRadius: '10px', color: '#000',
              fontWeight: 900, fontSize: '0.82rem', padding: '0.6rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            {connectStatus?.status === 'pending' ? 'Continue Setup' : 'Connect Bank'}
            <ExternalLink size={12} aria-hidden="true" />
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
            <button 
              key={t} 
              onClick={() => setTab(t)} 
              role="tab"
              aria-selected={tab === t}
              style={{
                padding: '0.45rem 1rem', borderRadius: '9px', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                background: tab === t ? '#10B981' : 'transparent',
                color: tab === t ? '#000' : 'rgba(255,255,255,0.4)',
                textTransform: 'capitalize',
              }}
            >
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
        <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.3)' }}>
          <Loader2 size={32} className="animate-spin" style={{ display: 'inline-block', color: '#10B981' }} />
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>Scanning opportunities...</p>
        </div>
      ) : tasks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '6rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.2)' }}
        >
          <Briefcase size={48} style={{ marginBottom: '1.5rem', opacity: 0.1, margin: '0 auto' }} />
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, margin: '0 0 0.5rem' }}>Marketplace Empty</h3>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>{tab === 'browse' ? 'No open tasks matching your criteria. Check back later or post your own!' : 'No tasks recorded in this category.'}</p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <AnimatePresence mode="popLayout">
            {tasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <TaskCard task={task} currentUserId={profile?.id ?? ''} fmt={fmt} onClick={() => setSelectedTask(task)} />
              </motion.div>
            ))}
          </AnimatePresence>
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
    </motion.div>
  )
}

function TaskCard({ task, currentUserId, fmt, onClick }: { task: Task; currentUserId: string; fmt: (c: number) => string; onClick: () => void }) {
  const isOwn = task.poster.id === currentUserId
  const meta = STATUS_META[task.status] ?? { label: task.status, color: '#6B7280' }

  return (
    <motion.div 
      onClick={onClick} 
      tabIndex={0}
      role="button"
      whileHover={{ scale: 1.005, y: -2 }}
      whileTap={{ scale: 0.995 }}
      aria-label={`Task: ${task.title}. Reward: ${fmt(task.net_payout_cents)}.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ 
        background: 'rgba(255,255,255,0.03)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.07)', 
        borderRadius: '18px', 
        padding: '1.25rem 1.5rem', 
        cursor: 'pointer', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        outline: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <span style={{ background: CATEGORY_COLORS[task.category] + '22', color: CATEGORY_COLORS[task.category], fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '7px', border: `1px solid ${CATEGORY_COLORS[task.category]}33` }}>{task.category}</span>
            {isOwn && <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)' }}>YOUR POST</span>}
            <span style={{ background: meta.color + '15', color: meta.color, fontSize: '0.65rem', fontWeight: 900, padding: '3px 9px', borderRadius: '7px', border: `1px solid ${meta.color}33` }}>{meta.label}</span>
          </div>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#F3F4F6', letterSpacing: '-0.02em' }}>{task.title}</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#10B981', letterSpacing: '-0.04em' }}>{fmt(task.net_payout_cents)}</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Earning</div>
          {task.deadline && (
            <div style={{ fontSize: '0.7rem', color: '#F59E0B', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', fontWeight: 700 }}>
              <Clock size={12} />
              {new Date(task.deadline).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 26, height: 26, borderRadius: '8px', background: 'var(--brand)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {task.poster.avatar_url ? <img src={task.poster.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 900 }}>{task.poster.full_name[0]}</span>}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{task.poster.full_name}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
           {task.connection_only && (
             <span style={{ fontSize: '0.65rem', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
               <Users size={11} /> Network Only
             </span>
           )}
           <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
        </div>
      </div>
    </motion.div>
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
      <FormField label="Title" htmlFor="hustle-title">
        <input id="hustle-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What do you need done?" maxLength={100} style={inputStyle} />
      </FormField>
      <FormField label="Description" htmlFor="hustle-desc">
        <textarea id="hustle-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the task in detail…" rows={4} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <FormField label="Category" htmlFor="hustle-cat">
          <select id="hustle-cat" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </FormField>
        <FormField label="Payout (USD)" htmlFor="hustle-payout">
          <input id="hustle-payout" value={form.payout} onChange={e => setForm(f => ({ ...f, payout: e.target.value }))} placeholder="e.g. 25.00" type="number" min="1" max="5000" step="0.01" style={inputStyle} />
        </FormField>
      </div>
      <FormField label="Deadline (optional)" htmlFor="hustle-deadline">
        <input id="hustle-deadline" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date" style={inputStyle} />
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
          <div className="form-group">
            <label htmlFor="apply-message" className="sr-only">Application Message</label>
            <textarea id="apply-message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Why are you a good fit? (optional)" rows={2} maxLength={500} style={{ ...inputStyle, marginBottom: '0.75rem', resize: 'none' }} />
          </div>
          <button onClick={apply} disabled={applying} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
            {applying ? <Loader2 size={13} style={{ display: 'inline' }} className="animate-spin" /> : null}
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      onClick={onClose} 
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()} 
        style={{ 
          background: '#0a0a0a', 
          border: '1px solid rgba(255,255,255,0.12)', 
          borderRadius: '28px', 
          padding: '2rem', 
          width: '100%', 
          maxWidth: '540px', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          position: 'relative',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'white', padding: '0.4rem', cursor: 'pointer' }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        {children}
      </motion.div>
    </div>
  )
}

function FormField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label htmlFor={htmlFor} style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px', padding: '0.75rem 1rem', color: '#F3F4F6', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s, background 0.2s'
}
const btnPrimary: React.CSSProperties = {
  background: '#10B981', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 900, fontSize: '0.9rem',
  padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
}
const btnSecondary: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)',
  fontWeight: 700, fontSize: '0.9rem', padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
}
const btnDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', color: '#EF4444',
  fontWeight: 700, fontSize: '0.9rem', padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
}

// Wrap in Suspense for useSearchParams
export default function HustlePageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}><Loader2 size={24} /></div>}>
      <HustlePage />
    </Suspense>
  )
}
