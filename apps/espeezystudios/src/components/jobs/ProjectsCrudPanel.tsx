'use client'

import Link from 'next/link'
import { StudioCrudPanel } from '@/components/studio/StudioCrudPanel'
import { supabase } from '@/lib/supabase-client'
import type { StudioJob } from '@/lib/jobs/types'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e42',
  in_progress: '#38bdf8',
  review: '#a78bfa',
  done: '#22c55e',
  cancelled: '#94a3b8',
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

type Props = {
  onMutate?: () => void
}

export function ProjectsCrudPanel({ onMutate }: Props) {
  return (
    <StudioCrudPanel<StudioJob>
      table="jobs"
      title="project"
      gearToggle
      gearLabel="Project settings"
      orderBy={{ column: 'created_at', ascending: false }}
      emptyLabel="No projects yet. Add one to open the full delivery workspace."
      deleteConfirmMessage="Delete this project and all timeline/budget data?"
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
        { key: 'client_name', label: 'Client name', required: false },
        { key: 'client_email', label: 'Client email', type: 'email', required: false },
        { key: 'deadline_at', label: 'Deadline', type: 'datetime', required: false },
      ]}
      buildEmpty={() => ({
        title: '',
        description: '',
        status: 'pending',
        client_name: '',
        client_email: '',
        deadline_at: null,
      })}
      mapInsert={(payload) => ({
        ...payload,
        delivery_status: 'draft',
      })}
      onAfterCreate={async (row) => {
        await supabase.from('studio_job_timeline_events').insert({
          job_id: row.id,
          title: 'Project created',
          description: row.description,
          kind: 'kickoff',
        })
      }}
      renderRow={(job) => (
        <>
          <Link href={`/jobs/${job.id}`} className="studio-link">
            {job.title}
          </Link>
          {job.client_name ? ` · ${job.client_name}` : ''}
          {' · '}
          <span style={{ color: STATUS_COLORS[job.status] ?? 'inherit' }}>{job.status}</span>
        </>
      )}
      onMutate={onMutate}
    />
  )
}
