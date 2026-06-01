import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchJobRelatedData } from '@/lib/jobs/fetch-related'
import {
  getServerJobSchemaCapabilities,
  type JobSchemaCapabilities,
} from '@/lib/jobs/schema-capabilities'
import type { JobBundle } from './types'

export async function fetchJobBundle(
  db: SupabaseClient,
  jobId: string,
  capabilities?: JobSchemaCapabilities,
): Promise<JobBundle | null> {
  const caps = capabilities ?? (await getServerJobSchemaCapabilities(db))

  const { data: job, error } = await db.from('jobs').select('*').eq('id', jobId).maybeSingle()
  if (error || !job) return null

  const related = await fetchJobRelatedData(db, jobId, caps)

  return {
    job,
    ...related,
  }
}
