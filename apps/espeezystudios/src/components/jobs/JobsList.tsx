'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Briefcase, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useRealtimeJobs } from '@/hooks/useRealtimeJobs'
import type { StudioJob } from '@/lib/jobs/types'
import { useStudioEditor } from '@/hooks/useStudioEditor'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e42',
  in_progress: '#38bdf8',
  review: '#a78bfa',
  done: '#22c55e',
  cancelled: '#94a3b8',
}

export default function JobsList() {
  const [jobs, setJobs] = useState<StudioJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', client_name: '', client_email: '' })
  const { canEdit } = useStudioEditor()

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
    setJobs((data ?? []) as StudioJob[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchJobs()
  }, [fetchJobs])

  useRealtimeJobs(() => void fetchJobs())

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          title: form.title,
          description: form.description,
          client_name: form.client_name || null,
          client_email: form.client_email || null,
          status: 'pending',
          delivery_status: 'draft',
        },
      ])
      .select('id')
      .single()
    if (!error && data?.id) {
      await supabase.from('studio_job_timeline_events').insert({
        job_id: data.id,
        title: 'Project created',
        description: form.description,
        kind: 'kickoff',
      })
    }
    setShowCreate(false)
    setForm({ title: '', description: '', client_name: '', client_email: '' })
    await fetchJobs()
  }

  const metrics = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    active: jobs.filter((j) => j.status === 'in_progress').length,
    done: jobs.filter((j) => j.status === 'done').length,
  }

  return (
    <div className="jobs-pro">
      <div className="jobs-pro__metrics">
        <span>Total <strong>{metrics.total}</strong></span>
        <span style={{ color: STATUS_COLORS.pending }}>Pending {metrics.pending}</span>
        <span style={{ color: STATUS_COLORS.in_progress }}>Active {metrics.active}</span>
        <span style={{ color: STATUS_COLORS.done }}>Done {metrics.done}</span>
      </div>

      {canEdit ? (
        <button type="button" className="studio-btn jobs-pro__new" onClick={() => setShowCreate(true)}>
          <Plus size={18} aria-hidden />
          New project job
        </button>
      ) : null}

      {loading ? (
        <p className="studio-muted">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="studio-muted">No jobs yet. Create a project to open the full delivery workspace.</p>
      ) : (
        <ul className="jobs-pro__list">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="jobs-pro__card">
                <span className="jobs-pro__card-icon" aria-hidden>
                  <Briefcase size={20} />
                </span>
                <span className="jobs-pro__card-body">
                  <span className="jobs-pro__card-title">{job.title}</span>
                  <span className="jobs-pro__card-meta">
                    {job.client_name || 'No client'} ·{' '}
                    <span style={{ color: STATUS_COLORS[job.status] ?? 'inherit' }}>{job.status}</span>
                    {job.deadline_at ? ` · due ${new Date(job.deadline_at).toLocaleDateString()}` : ''}
                  </span>
                </span>
                <ChevronRight size={18} className="jobs-pro__chev" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showCreate ? (
        <div className="studio-crud__overlay" onClick={() => setShowCreate(false)}>
          <form className="studio-crud__modal" onSubmit={(e) => void handleCreate(e)} onClick={(e) => e.stopPropagation()}>
            <h3>New project job</h3>
            <label className="studio-crud__field">
              <span>Title</span>
              <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </label>
            <label className="studio-crud__field">
              <span>Description</span>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="studio-crud__field">
              <span>Client name</span>
              <input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} />
            </label>
            <label className="studio-crud__field">
              <span>Client email (for delivery)</span>
              <input type="email" value={form.client_email} onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))} />
            </label>
            <div className="studio-crud__modal-actions">
              <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="studio-btn">
                Create
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
