import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isMissingRelationError,
  JOB_RELATED_TABLES,
  type JobSchemaCapabilities,
} from '@/lib/jobs/schema-capabilities'
import type {
  JobBudgetEntry,
  JobDeliveryLog,
  JobMilestone,
  JobTimelineEvent,
} from '@/lib/jobs/types'

async function fetchTableRows<T>(
  db: SupabaseClient,
  table: string,
  jobId: string,
  order: { column: string; ascending?: boolean },
): Promise<T[]> {
  const { data, error } = await db
    .from(table)
    .select('*')
    .eq('job_id', jobId)
    .order(order.column, { ascending: order.ascending ?? true })

  if (error) {
    if (isMissingRelationError(error)) return []
    return []
  }
  return (data ?? []) as T[]
}

export async function fetchJobRelatedData(
  db: SupabaseClient,
  jobId: string,
  caps: JobSchemaCapabilities,
): Promise<{
  milestones: JobMilestone[]
  budgetEntries: JobBudgetEntry[]
  timeline: JobTimelineEvent[]
  deliveryLogs: JobDeliveryLog[]
}> {
  const [milestones, budgetEntries, timeline, deliveryLogs] = await Promise.all([
    caps.tables.milestones
      ? fetchTableRows<JobMilestone>(db, JOB_RELATED_TABLES.milestones, jobId, {
          column: 'sort_order',
          ascending: true,
        })
      : Promise.resolve([] as JobMilestone[]),
    caps.tables.budget
      ? fetchTableRows<JobBudgetEntry>(db, JOB_RELATED_TABLES.budget, jobId, {
          column: 'entry_date',
          ascending: false,
        })
      : Promise.resolve([] as JobBudgetEntry[]),
    caps.tables.timeline
      ? fetchTableRows<JobTimelineEvent>(db, JOB_RELATED_TABLES.timeline, jobId, {
          column: 'event_at',
          ascending: false,
        })
      : Promise.resolve([] as JobTimelineEvent[]),
    caps.tables.deliveryLogs
      ? fetchTableRows<JobDeliveryLog>(db, JOB_RELATED_TABLES.deliveryLogs, jobId, {
          column: 'sent_at',
          ascending: false,
        })
      : Promise.resolve([] as JobDeliveryLog[]),
  ])

  return { milestones, budgetEntries, timeline, deliveryLogs }
}
