import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'
import type { StudioJob } from '@/lib/jobs/types'

/** Always present on minimal `jobs` table. */
export const CORE_JOB_FIELDS = ['title', 'description', 'status', 'updated_at'] as const

/** Added by studio_jobs_delivery_system migration. */
export const OPTIONAL_JOB_COLUMNS = [
  'client_name',
  'client_email',
  'budget_cents',
  'currency',
  'deadline_at',
  'started_at',
  'completed_at',
  'assigned_to',
  'requirements_text',
  'prd_text',
  'delivery_status',
  'invoice_number',
  'receipt_number',
  'last_delivered_at',
  'final_report_text',
] as const

export type OptionalJobColumn = (typeof OPTIONAL_JOB_COLUMNS)[number]

export const JOB_RELATED_TABLES = {
  milestones: 'studio_job_milestones',
  budget: 'studio_job_budget_entries',
  timeline: 'studio_job_timeline_events',
  deliveryLogs: 'studio_job_delivery_logs',
  documents: 'studio_job_documents',
} as const

export type JobRelatedTableKey = keyof typeof JOB_RELATED_TABLES

export type JobSchemaCapabilities = {
  columns: Record<OptionalJobColumn, boolean>
  tables: Record<JobRelatedTableKey, boolean>
}

export type JobWorkspaceTab = 'overview' | 'timeline' | 'budget' | 'milestones' | 'docs' | 'delivery'

export function isMissingRelationError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const msg = error.message ?? ''
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('Could not find the table')
  )
}

export function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const msg = error.message ?? ''
  return error.code === '42703' || (msg.includes('column') && msg.includes('does not exist'))
}

async function probeColumn(db: SupabaseClient, column: string): Promise<boolean> {
  const { error } = await db.from('jobs').select(column).limit(0)
  if (!error) return true
  if (isMissingColumnError(error)) return false
  return true
}

async function probeTable(db: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await db.from(table).select('id', { head: true, count: 'exact' })
  if (!error) return true
  if (isMissingRelationError(error)) return false
  return true
}

export async function fetchJobSchemaCapabilities(db: SupabaseClient): Promise<JobSchemaCapabilities> {
  const [columnEntries, tableEntries] = await Promise.all([
    Promise.all(
      OPTIONAL_JOB_COLUMNS.map(async (col) => [col, await probeColumn(db, col)] as const),
    ),
    Promise.all(
      (Object.entries(JOB_RELATED_TABLES) as [JobRelatedTableKey, string][]).map(
        async ([key, table]) => [key, await probeTable(db, table)] as const,
      ),
    ),
  ])

  return {
    columns: Object.fromEntries(columnEntries) as JobSchemaCapabilities['columns'],
    tables: Object.fromEntries(tableEntries) as JobSchemaCapabilities['tables'],
  }
}

let clientCapabilitiesCache: Promise<JobSchemaCapabilities> | null = null
let serverCapabilitiesCache: Promise<JobSchemaCapabilities> | null = null

/** Cached per browser session - probes run once. */
export function getClientJobSchemaCapabilities(): Promise<JobSchemaCapabilities> {
  if (!clientCapabilitiesCache) {
    clientCapabilitiesCache = fetchJobSchemaCapabilities(supabase)
  }
  return clientCapabilitiesCache
}

/** Cached per server process - avoids re-probing on every API request. */
export function getServerJobSchemaCapabilities(db: SupabaseClient): Promise<JobSchemaCapabilities> {
  if (!serverCapabilitiesCache) {
    serverCapabilitiesCache = fetchJobSchemaCapabilities(db)
  }
  return serverCapabilitiesCache
}

export function invalidateJobSchemaCapabilitiesCache(): void {
  clientCapabilitiesCache = null
  serverCapabilitiesCache = null
}

export function hasExtendedJobFeatures(caps: JobSchemaCapabilities): boolean {
  return (
    OPTIONAL_JOB_COLUMNS.some((c) => caps.columns[c]) ||
    (Object.keys(JOB_RELATED_TABLES) as JobRelatedTableKey[]).some((t) => caps.tables[t])
  )
}

export function jobWorkspaceTabs(caps: JobSchemaCapabilities): JobWorkspaceTab[] {
  const tabs: JobWorkspaceTab[] = ['overview']
  if (caps.tables.timeline) tabs.push('timeline')
  if (caps.tables.budget) tabs.push('budget')
  if (caps.tables.milestones) tabs.push('milestones')
  if (
    caps.tables.documents ||
    caps.columns.requirements_text ||
    caps.columns.prd_text
  ) {
    tabs.push('docs')
  }
  if (
    caps.columns.client_email &&
    caps.columns.delivery_status &&
    caps.tables.deliveryLogs
  ) {
    tabs.push('delivery')
  }
  return tabs
}

export function buildJobUpdatePayload(
  job: Partial<StudioJob>,
  caps: JobSchemaCapabilities,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: job.title,
    description: job.description ?? '',
    status: job.status,
    updated_at: new Date().toISOString(),
  }

  const optionalMap: Partial<Record<OptionalJobColumn, unknown>> = {
    client_name: job.client_name ?? null,
    client_email: job.client_email ?? null,
    budget_cents: job.budget_cents ?? 0,
    currency: job.currency ?? 'GBP',
    deadline_at: job.deadline_at || null,
    started_at: job.started_at || null,
    completed_at: job.completed_at || null,
    assigned_to: job.assigned_to ?? null,
    requirements_text: job.requirements_text ?? null,
    prd_text: job.prd_text ?? null,
    delivery_status: job.delivery_status ?? null,
    invoice_number: job.invoice_number ?? null,
    receipt_number: job.receipt_number ?? null,
    last_delivered_at: job.last_delivered_at || null,
    final_report_text: job.final_report_text ?? null,
  }

  for (const col of OPTIONAL_JOB_COLUMNS) {
    if (caps.columns[col] && col in optionalMap) {
      payload[col] = optionalMap[col]
    }
  }

  return payload
}

export function buildJobInsertPayload(
  job: Partial<StudioJob>,
  caps: JobSchemaCapabilities,
): Record<string, unknown> {
  const payload = buildJobUpdatePayload(job, caps)
  delete payload.updated_at
  return payload
}
