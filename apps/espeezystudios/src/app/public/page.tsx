import StudioPageShell from '@/components/StudioPageShell'
import { serverSupabase } from '../../lib/server-db'
import type { StudioJob } from '@/lib/jobs/types'

export const dynamic = 'force-dynamic'

export default async function PublicFeedPage() {
  const pageSize = 10
  const page = 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let jobs: StudioJob[] = []
  let error: { message?: string } | null = null
  try {
    const { data, error: fetchError } = await serverSupabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)
    jobs = (data ?? []) as StudioJob[]
    error = fetchError
  } catch (e) {
    error = e instanceof Error ? { message: e.message } : { message: String(e) }
  }

  return (
    <StudioPageShell
      title="Portfolio"
      description="Public showcase of completed and in-progress studio projects."
      wide
    >
      <div className="studio-panel">
        {error ? (
          <p className="studio-panel__error">Failed to load jobs: {String(error.message || error)}</p>
        ) : null}
        {jobs.length === 0 && !error ? <p>No published projects yet.</p> : null}
        {jobs.length > 0 ? (
          <ul className="studio-list">
            {jobs.map((job) => (
              <li key={job.id} className="studio-list__item">
                <div className="studio-list__title">{job.title}</div>
                <div className="studio-list__meta">
                  {job.status} · {job.created_at ? new Date(job.created_at).toLocaleDateString() : ''}
                </div>
                {job.description ? <p className="studio-list__desc">{job.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </StudioPageShell>
  )
}
