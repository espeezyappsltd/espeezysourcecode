'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Briefcase, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useRealtimeJobs } from '@/hooks/useRealtimeJobs'
import type { StudioJob } from '@/lib/jobs/types'
import { useStudioEditor } from '@/hooks/useStudioEditor'
import { ProjectsCrudPanel } from '@/components/jobs/ProjectsCrudPanel'

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

  const metrics = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    active: jobs.filter((j) => j.status === 'in_progress').length,
    done: jobs.filter((j) => j.status === 'done').length,
  }

  return (
    <div className="jobs-pro">
      {canEdit ? <ProjectsCrudPanel onMutate={() => void fetchJobs()} /> : null}

      <div className="jobs-pro__metrics">
        <span>
          Total <strong>{metrics.total}</strong>
        </span>
        <span style={{ color: STATUS_COLORS.pending }}>Pending {metrics.pending}</span>
        <span style={{ color: STATUS_COLORS.in_progress }}>Active {metrics.active}</span>
        <span style={{ color: STATUS_COLORS.done }}>Done {metrics.done}</span>
      </div>

      {loading ? (
        <p className="studio-muted">Loading projects…</p>
      ) : jobs.length === 0 ? (
        <p className="studio-muted">No projects yet. Use the settings gear to add one, or open the delivery workspace from an existing project.</p>
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
                    <span style={{ color: STATUS_COLORS[job.status] ?? 'inherit' }}>{job.status}</span>
                  </span>
                </span>
                <ChevronRight size={18} className="jobs-pro__chev" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
