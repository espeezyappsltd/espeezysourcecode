import GlobalFooter from '../../components/GlobalFooter'
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
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Espeezy Studio Portfolio</h1>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-800 shadow">
          {error && (
            <div className="text-red-500 mb-4">Failed to load jobs: {String(error.message || error)}</div>
          )}
          {jobs.length === 0 && !error && (
            <p className="text-neutral-500">No jobs found.</p>
          )}
          <ul className="space-y-6">
            {jobs.map((job) => (
              <li key={job.id} className="border-b pb-4">
                <div className="font-semibold text-lg">{job.title}</div>
                <div className="text-neutral-500 text-sm mb-1">{job.status} · {job.created_at ? new Date(job.created_at).toLocaleDateString() : ''}</div>
                <div className="text-neutral-700 dark:text-neutral-200">{job.description}</div>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
