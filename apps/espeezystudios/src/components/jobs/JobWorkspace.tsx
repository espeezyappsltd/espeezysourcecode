'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Flag,
  Loader2,
  Mail,
  Package,
  Save,
  Trash2,
  Download,
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useJobBundle } from '@/hooks/useJobBundle'
import { useStudioEditor } from '@/hooks/useStudioEditor'
import type { JobBudgetEntry, JobMilestone, JobTimelineEvent, StudioJob } from '@/lib/jobs/types'

const TABS = ['overview', 'timeline', 'budget', 'milestones', 'docs', 'delivery'] as const
type Tab = (typeof TABS)[number]

function money(cents: number, currency: string) {
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : `${currency} `
  return `${sym}${(cents / 100).toFixed(2)}`
}

export default function JobWorkspace({ jobId }: { jobId: string }) {
  const { bundle, loading, error, refresh } = useJobBundle(jobId)
  const { canEdit } = useStudioEditor()
  const [tab, setTab] = useState<Tab>('overview')
  const [saving, setSaving] = useState(false)
  const [delivering, setDelivering] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [jobForm, setJobForm] = useState<Partial<StudioJob>>({})

  if (loading) {
    return <p className="studio-muted"><Loader2 className="spin" size={18} /> Loading project…</p>
  }

  if (error || !bundle) {
    return (
      <div>
        <p className="studio-crud__error">{error ?? 'Job not found'}</p>
        <Link href="/jobs" className="studio-link">← All jobs</Link>
      </div>
    )
  }

  const job = { ...bundle.job, ...jobForm }
  const currency = job.currency || 'GBP'
  const budgetTotal = bundle.budgetEntries.reduce((s, e) => s + e.amount_cents, 0)

  async function saveJob() {
    setSaving(true)
    setStatus(null)
    const { error: err } = await supabase
      .from('jobs')
      .update({
        title: job.title,
        description: job.description,
        status: job.status,
        client_name: job.client_name,
        client_email: job.client_email,
        budget_cents: job.budget_cents,
        currency: job.currency,
        deadline_at: job.deadline_at || null,
        requirements_text: job.requirements_text,
        prd_text: job.prd_text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
    setSaving(false)
    if (err) setStatus(err.message)
    else {
      setStatus('Saved.')
      await refresh()
    }
  }

  async function runDelivery() {
    if (!job.client_email) {
      setStatus('Add client email before delivery.')
      return
    }
    setDelivering(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/studio/jobs/${jobId}/deliver`, { method: 'POST', credentials: 'include' })
      const data = (await res.json()) as { ok?: boolean; error?: string; invoiceNumber?: string }
      if (!res.ok) throw new Error(data.error ?? 'Delivery failed')
      setStatus(`Delivered — invoice ${data.invoiceNumber} emailed to client.`)
      await refresh()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Delivery failed')
    } finally {
      setDelivering(false)
    }
  }

  async function deleteJob() {
    if (!confirm('Delete this job and all timeline/budget data?')) return
    await supabase.from('jobs').delete().eq('id', jobId)
    window.location.href = '/jobs'
  }

  return (
    <div className="jobs-workspace">
      <div className="jobs-workspace__top">
        <Link href="/jobs" className="jobs-workspace__back">
          <ArrowLeft size={16} /> Jobs
        </Link>
        <h2 className="jobs-workspace__title">{job.title}</h2>
        <p className="jobs-workspace__sub">
          {job.client_name || 'No client'}
          {job.client_email ? ` · ${job.client_email}` : ''}
          {job.deadline_at ? ` · Deadline ${new Date(job.deadline_at).toLocaleString()}` : ''}
        </p>
      </div>

      <div className="jobs-workspace__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`jobs-workspace__tab${tab === t ? ' is-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'docs' ? 'Requirements & PRD' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {status ? <p className="studio-success" role="status">{status}</p> : null}

      {tab === 'overview' && (
        <section className="jobs-panel">
          {canEdit ? (
            <>
              <div className="jobs-form-grid">
                <label className="studio-crud__field">
                  <span>Title</span>
                  <input value={job.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} />
                </label>
                <label className="studio-crud__field">
                  <span>Status</span>
                  <select value={job.status} onChange={(e) => setJobForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label className="studio-crud__field">
                  <span>Client name</span>
                  <input value={job.client_name ?? ''} onChange={(e) => setJobForm((f) => ({ ...f, client_name: e.target.value }))} />
                </label>
                <label className="studio-crud__field">
                  <span>Client email</span>
                  <input type="email" value={job.client_email ?? ''} onChange={(e) => setJobForm((f) => ({ ...f, client_email: e.target.value }))} />
                </label>
                <label className="studio-crud__field">
                  <span>Deadline</span>
                  <input
                    type="datetime-local"
                    value={job.deadline_at ? job.deadline_at.slice(0, 16) : ''}
                    onChange={(e) => setJobForm((f) => ({ ...f, deadline_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                  />
                </label>
                <label className="studio-crud__field">
                  <span>Budget ({currency})</span>
                  <input
                    type="number"
                    step="0.01"
                    value={((job.budget_cents ?? 0) / 100).toFixed(2)}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, budget_cents: Math.round(parseFloat(e.target.value || '0') * 100) }))
                    }
                  />
                </label>
              </div>
              <label className="studio-crud__field">
                <span>Description</span>
                <textarea rows={4} value={job.description} onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <div className="jobs-workspace__actions">
                <button type="button" className="studio-btn" disabled={saving} onClick={() => void saveJob()}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void deleteJob()}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </>
          ) : (
            <p>{job.description}</p>
          )}
          <div className="jobs-summary-cards">
            <div className="jobs-summary-card">
              <DollarSign size={18} />
              <span>Budget lines</span>
              <strong>{money(budgetTotal, currency)}</strong>
            </div>
            <div className="jobs-summary-card">
              <Flag size={18} />
              <span>Milestones</span>
              <strong>{bundle.milestones.length}</strong>
            </div>
            <div className="jobs-summary-card">
              <Calendar size={18} />
              <span>Timeline events</span>
              <strong>{bundle.timeline.length}</strong>
            </div>
            <div className="jobs-summary-card">
              <Package size={18} />
              <span>Delivery</span>
              <strong>{job.delivery_status || 'draft'}</strong>
            </div>
          </div>
        </section>
      )}

      {tab === 'timeline' && (
        <TimelinePanel jobId={jobId} events={bundle.timeline} canEdit={canEdit} onRefresh={refresh} />
      )}

      {tab === 'budget' && (
        <BudgetPanel jobId={jobId} entries={bundle.budgetEntries} currency={currency} canEdit={canEdit} onRefresh={refresh} />
      )}

      {tab === 'milestones' && (
        <MilestonesPanel jobId={jobId} milestones={bundle.milestones} canEdit={canEdit} onRefresh={refresh} />
      )}

      {tab === 'docs' && (
        <section className="jobs-panel">
          <h3><FileText size={18} /> Requirements & PRD</h3>
          <p className="studio-muted">Edit source text; delivery regenerates requirements.txt and PRD.md from this content.</p>
          {canEdit ? (
            <>
              <label className="studio-crud__field">
                <span>Requirements (requirements.txt body)</span>
                <textarea
                  rows={10}
                  className="jobs-code"
                  value={job.requirements_text ?? ''}
                  onChange={(e) => setJobForm((f) => ({ ...f, requirements_text: e.target.value }))}
                  placeholder="List functional requirements, one per line…"
                />
              </label>
              <label className="studio-crud__field">
                <span>PRD (markdown)</span>
                <textarea
                  rows={12}
                  className="jobs-code"
                  value={job.prd_text ?? ''}
                  onChange={(e) => setJobForm((f) => ({ ...f, prd_text: e.target.value }))}
                  placeholder="# PRD…"
                />
              </label>
              <button type="button" className="studio-btn" onClick={() => void saveJob()}>
                Save documents
              </button>
            </>
          ) : (
            <pre className="jobs-code">{job.requirements_text || '—'}</pre>
          )}
          <div className="jobs-downloads">
            <a href={`/api/studio/jobs/${jobId}/documents?type=requirements`} className="studio-link">
              <Download size={14} /> requirements.txt
            </a>
            <a href={`/api/studio/jobs/${jobId}/documents?type=prd`} className="studio-link">
              <Download size={14} /> PRD.md
            </a>
          </div>
        </section>
      )}

      {tab === 'delivery' && (
        <section className="jobs-panel">
          <h3><Mail size={18} /> App delivery system</h3>
          <p className="studio-muted">
            Sends requirements.txt, PRD.md, final report, invoice, and receipt to the client email. Logs delivery on the timeline.
          </p>
          <ul className="jobs-delivery-meta">
            <li>Invoice: <strong>{job.invoice_number || '— (generated on send)'}</strong></li>
            <li>Receipt: <strong>{job.receipt_number || '—'}</strong></li>
            <li>Last delivered: <strong>{job.last_delivered_at ? new Date(job.last_delivered_at).toLocaleString() : 'Never'}</strong></li>
          </ul>
          {canEdit ? (
            <button type="button" className="studio-btn jobs-deliver-btn" disabled={delivering} onClick={() => void runDelivery()}>
              {delivering ? <Loader2 className="spin" size={18} /> : <Mail size={18} />}
              {delivering ? 'Sending…' : 'Send delivery package to client'}
            </button>
          ) : null}
          <a href={`/api/studio/jobs/${jobId}/documents?type=report`} className="studio-link" style={{ display: 'inline-block', marginTop: '1rem' }}>
            <Download size={14} /> Download final report preview
          </a>
          {bundle.deliveryLogs.length > 0 ? (
            <div style={{ marginTop: '1.5rem' }}>
              <h4>Delivery log</h4>
              <ul className="jobs-timeline-list">
                {bundle.deliveryLogs.map((d) => (
                  <li key={d.id}>
                    <time>{new Date(d.sent_at).toLocaleString()}</time>
                    <span>
                      → {d.sent_to} · {d.invoice_number}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}

function TimelinePanel({
  jobId,
  events,
  canEdit,
  onRefresh,
}: {
  jobId: string
  events: JobTimelineEvent[]
  canEdit: boolean
  onRefresh: () => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [kind, setKind] = useState('note')

  async function add() {
    if (!title.trim()) return
    await supabase.from('studio_job_timeline_events').insert({
      job_id: jobId,
      title: title.trim(),
      description: desc,
      kind,
      event_at: new Date().toISOString(),
    })
    setTitle('')
    setDesc('')
    await onRefresh()
  }

  async function remove(id: string) {
    if (!confirm('Remove event?')) return
    await supabase.from('studio_job_timeline_events').delete().eq('id', id)
    await onRefresh()
  }

  return (
    <section className="jobs-panel">
      <h3>Full timeline</h3>
      {canEdit ? (
        <div className="jobs-inline-form">
          <input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="note">Note</option>
            <option value="kickoff">Kickoff</option>
            <option value="milestone">Milestone</option>
            <option value="review">Review</option>
            <option value="delivery">Delivery</option>
            <option value="payment">Payment</option>
          </select>
          <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <button type="button" className="studio-btn" onClick={() => void add()}>
            Add event
          </button>
        </div>
      ) : null}
      <ul className="jobs-timeline-list">
        {events.map((e) => (
          <li key={e.id}>
            <time>{new Date(e.event_at).toLocaleString()}</time>
            <span className="jobs-timeline-kind">{e.kind}</span>
            <strong>{e.title}</strong>
            {e.description ? <p>{e.description}</p> : null}
            {canEdit ? (
              <button type="button" className="jobs-tiny-btn" onClick={() => void remove(e.id)}>
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function BudgetPanel({
  jobId,
  entries,
  currency,
  canEdit,
  onRefresh,
}: {
  jobId: string
  entries: JobBudgetEntry[]
  currency: string
  canEdit: boolean
  onRefresh: () => Promise<void>
}) {
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [entryType, setEntryType] = useState<JobBudgetEntry['entry_type']>('estimate')

  async function add() {
    const cents = Math.round(parseFloat(amount || '0') * 100)
    if (!label.trim()) return
    await supabase.from('studio_job_budget_entries').insert({
      job_id: jobId,
      label: label.trim(),
      amount_cents: cents,
      entry_type: entryType,
    })
    setLabel('')
    setAmount('')
    await onRefresh()
  }

  async function remove(id: string) {
    await supabase.from('studio_job_budget_entries').delete().eq('id', id)
    await onRefresh()
  }

  const total = entries.reduce((s, e) => s + e.amount_cents, 0)

  return (
    <section className="jobs-panel">
      <h3>Budget entries</h3>
      <p className="jobs-total">Total: <strong>{money(total, currency)}</strong></p>
      {canEdit ? (
        <div className="jobs-inline-form">
          <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input placeholder="Amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select value={entryType} onChange={(e) => setEntryType(e.target.value as JobBudgetEntry['entry_type'])}>
            <option value="estimate">Estimate</option>
            <option value="actual">Actual</option>
            <option value="invoice">Invoice</option>
            <option value="expense">Expense</option>
          </select>
          <button type="button" className="studio-btn" onClick={() => void add()}>
            Add line
          </button>
        </div>
      ) : null}
      <table className="jobs-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Label</th>
            <th>Type</th>
            <th>Amount</th>
            {canEdit ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{e.entry_date}</td>
              <td>{e.label}</td>
              <td>{e.entry_type}</td>
              <td>{money(e.amount_cents, currency)}</td>
              {canEdit ? (
                <td>
                  <button type="button" className="jobs-tiny-btn" onClick={() => void remove(e.id)}>
                    ×
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function MilestonesPanel({
  jobId,
  milestones,
  canEdit,
  onRefresh,
}: {
  jobId: string
  milestones: JobMilestone[]
  canEdit: boolean
  onRefresh: () => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')

  async function add() {
    if (!title.trim()) return
    await supabase.from('studio_job_milestones').insert({
      job_id: jobId,
      title: title.trim(),
      due_at: due ? new Date(due).toISOString() : null,
      status: 'pending',
      sort_order: milestones.length,
    })
    setTitle('')
    setDue('')
    await onRefresh()
  }

  async function toggle(m: JobMilestone) {
    const done = m.status !== 'done'
    await supabase
      .from('studio_job_milestones')
      .update({
        status: done ? 'done' : 'pending',
        completed_at: done ? new Date().toISOString() : null,
      })
      .eq('id', m.id)
    await onRefresh()
  }

  return (
    <section className="jobs-panel">
      <h3>Milestones & deadlines</h3>
      {canEdit ? (
        <div className="jobs-inline-form">
          <input placeholder="Milestone title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          <button type="button" className="studio-btn" onClick={() => void add()}>
            Add milestone
          </button>
        </div>
      ) : null}
      <ul className="jobs-milestones">
        {milestones.map((m) => (
          <li key={m.id} className={m.status === 'done' ? 'is-done' : ''}>
            <button type="button" className="jobs-milestone-check" disabled={!canEdit} onClick={() => void toggle(m)}>
              {m.status === 'done' ? '✓' : '○'}
            </button>
            <div>
              <strong>{m.title}</strong>
              {m.due_at ? <span className="jobs-milestone-due">Due {new Date(m.due_at).toLocaleString()}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
