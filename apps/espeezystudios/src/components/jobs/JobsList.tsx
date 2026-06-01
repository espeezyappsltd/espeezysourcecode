'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Briefcase, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useRealtimeJobs } from '@/hooks/useRealtimeJobs'
import { useJobSchemaCapabilities } from '@/hooks/useJobSchemaCapabilities'
import type { StudioJob } from '@/lib/jobs/types'
import { useStudioEditor } from '@/hooks/useStudioEditor'
import { JOB_STATUS_COLORS } from '@/lib/jobs/job-form'
import { JobFormModal } from '@/components/jobs/JobFormModal'

export default function JobsList() {
  const router = useRouter()
  const [jobs, setJobs] = useState<StudioJob[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const { canEdit } = useStudioEditor()
  const { capabilities, loading: capsLoading } = useJobSchemaCapabilities()

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

  const metrics = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    active: jobs.filter((j) => j.status === 'in_progress').length,
    done: jobs.filter((j) => j.status === 'done').length,
  }

  return (
    <div className="jobs-pro">
      <div className="jobs-pro__head">
        <div className="jobs-pro__metrics">
          <span>
            Total <strong>{metrics.total}</strong>
          </span>
          <span style={{ color: JOB_STATUS_COLORS.pending }}>Pending {metrics.pending}</span>
          <span style={{ color: JOB_STATUS_COLORS.in_progress }}>Active {metrics.active}</span>
          <span style={{ color: JOB_STATUS_COLORS.done }}>Done {metrics.done}</span>
        </div>
        {canEdit ? (
          <button
            type="button"
            className="jobs-pro__add"
            aria-label="Add new project"
            disabled={capsLoading || !capabilities}
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={22} strokeWidth={2.5} aria-hidden />
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="studio-muted">Loading projects…</p>
      ) : jobs.length === 0 ? (
        <p className="studio-muted">
          No projects yet.
          {canEdit ? ' Tap + to create one.' : ''}
        </p>
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
                    <span style={{ color: JOB_STATUS_COLORS[job.status] ?? 'inherit' }}>{job.status}</span>
                    {job.description ? ` · ${job.description.slice(0, 80)}${job.description.length > 80 ? '…' : ''}` : ''}
                  </span>
                </span>
                <ChevronRight size={18} className="jobs-pro__chev" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {capabilities ? (
        <JobFormModal
          open={createOpen}
          mode="create"
          capabilities={capabilities}
          onClose={() => setCreateOpen(false)}
          onSaved={(job) => {
            void fetchJobs()
            router.push(`/jobs/${job.id}`)
          }}
        />
      ) : null}
    </div>
  )
}
