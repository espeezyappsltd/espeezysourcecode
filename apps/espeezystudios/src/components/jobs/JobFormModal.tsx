'use client'

import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import {
  emptyJobForm,
  jobToFormValues,
  JOB_STATUS_OPTIONS,
} from '@/lib/jobs/job-form'
import {
  buildJobInsertPayload,
  buildJobUpdatePayload,
  type JobSchemaCapabilities,
} from '@/lib/jobs/schema-capabilities'
import type { StudioJob } from '@/lib/jobs/types'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  job?: StudioJob | null
  capabilities: JobSchemaCapabilities
  onClose: () => void
  onSaved: (job: StudioJob) => void
  onDeleted?: () => void
}

export function JobFormModal({
  open,
  mode,
  job,
  capabilities: caps,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [form, setForm] = useState<Partial<StudioJob>>(emptyJobForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(mode === 'edit' && job ? jobToFormValues(job) : emptyJobForm())
  }, [open, mode, job])

  if (!open) return null

  const currency = caps.columns.currency ? form.currency || 'GBP' : 'GBP'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = form.title?.trim()
    if (!title) {
      setError('Title is required.')
      return
    }

    setLoading(true)
    setError(null)

    const values: Partial<StudioJob> = {
      ...form,
      title,
      description: form.description ?? '',
      status: form.status ?? 'pending',
    }

    if (mode === 'create') {
      const { data, error: err } = await supabase
        .from('jobs')
        .insert([buildJobInsertPayload(values, caps)])
        .select('*')
        .single()

      setLoading(false)
      if (err) {
        setError(err.message)
        return
      }
      if (data) {
        onSaved(data as StudioJob)
        onClose()
      }
      return
    }

    if (!job) {
      setLoading(false)
      setError('Project not found.')
      return
    }

    const { data, error: err } = await supabase
      .from('jobs')
      .update(buildJobUpdatePayload({ ...job, ...values }, caps))
      .eq('id', job.id)
      .select('*')
      .single()

    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    if (data) {
      onSaved(data as StudioJob)
      onClose()
    }
  }

  async function handleDelete() {
    if (!job || !onDeleted) return
    if (!confirm('Delete this project and all related data?')) return
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.from('jobs').delete().eq('id', job.id)
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    onDeleted()
    onClose()
  }

  return (
    <div className="studio-crud__overlay" role="presentation" onClick={onClose}>
      <form
        className="studio-crud__modal job-form-modal"
        onSubmit={(e) => void handleSubmit(e)}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="studio-crud__modal-title">{mode === 'create' ? 'New project' : 'Edit project'}</h3>

        {error ? (
          <p className="studio-crud__error" role="alert">
            {error}
          </p>
        ) : null}

        <label className="studio-crud__field">
          <span>Title</span>
          <input
            value={form.title ?? ''}
            placeholder="Project name"
            required
            autoFocus
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </label>

        <label className="studio-crud__field">
          <span>Status</span>
          <select value={form.status ?? 'pending'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            {JOB_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {caps.columns.client_name ? (
          <label className="studio-crud__field">
            <span>Client name</span>
            <input
              value={form.client_name ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
            />
          </label>
        ) : null}

        {caps.columns.client_email ? (
          <label className="studio-crud__field">
            <span>Client email</span>
            <input
              type="email"
              value={form.client_email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
            />
          </label>
        ) : null}

        {caps.columns.deadline_at ? (
          <label className="studio-crud__field">
            <span>Deadline</span>
            <input
              type="datetime-local"
              value={form.deadline_at ? form.deadline_at.slice(0, 16) : ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  deadline_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
            />
          </label>
        ) : null}

        {caps.columns.budget_cents ? (
          <label className="studio-crud__field">
            <span>Budget ({currency})</span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={((form.budget_cents ?? 0) / 100).toFixed(2)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  budget_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                }))
              }
            />
          </label>
        ) : null}

        <label className="studio-crud__field">
          <span>Description</span>
          <textarea
            rows={4}
            value={form.description ?? ''}
            placeholder="What is this project about?"
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>

        <div className="studio-crud__modal-actions job-form-modal__actions">
          {mode === 'edit' && onDeleted ? (
            <button
              type="button"
              className="studio-btn studio-btn--ghost job-form-modal__delete"
              disabled={loading}
              onClick={() => void handleDelete()}
            >
              <Trash2 size={16} aria-hidden />
              Delete
            </button>
          ) : null}
          <button type="button" className="studio-btn studio-btn--ghost" disabled={loading} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="studio-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={16} aria-hidden /> Saving…
              </>
            ) : mode === 'create' ? (
              'Create project'
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
