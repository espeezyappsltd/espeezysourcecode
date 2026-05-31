import type { SupabaseClient } from '@supabase/supabase-js'
import type { JobBundle } from './types'

export async function fetchJobBundle(db: SupabaseClient, jobId: string): Promise<JobBundle | null> {
  const { data: job, error } = await db.from('jobs').select('*').eq('id', jobId).maybeSingle()
  if (error || !job) return null

  const [milestones, budgetEntries, timeline, deliveryLogs] = await Promise.all([
    db.from('studio_job_milestones').select('*').eq('job_id', jobId).order('sort_order'),
    db.from('studio_job_budget_entries').select('*').eq('job_id', jobId).order('entry_date', { ascending: false }),
    db.from('studio_job_timeline_events').select('*').eq('job_id', jobId).order('event_at', { ascending: false }),
    db.from('studio_job_delivery_logs').select('*').eq('job_id', jobId).order('sent_at', { ascending: false }),
  ])

  return {
    job,
    milestones: milestones.data ?? [],
    budgetEntries: budgetEntries.data ?? [],
    timeline: timeline.data ?? [],
    deliveryLogs: deliveryLogs.data ?? [],
  }
}
