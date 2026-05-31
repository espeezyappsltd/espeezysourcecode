import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Tables defined in supabase/migrations for Espeezy Studios UI. */
export const STUDIO_SCHEMA_TABLES = [
  'studio_team_members',
  'studio_projects',
  'studio_progress_items',
  'studio_quick_actions',
  'studio_analytics_kpis',
  'jobs',
  'studio_job_milestones',
  'studio_job_budget_entries',
  'studio_job_timeline_events',
  'studio_job_delivery_logs',
] as const

export type StudioTableStatus = {
  table: (typeof STUDIO_SCHEMA_TABLES)[number]
  ok: boolean
  error?: string
}

export type StudioSchemaCheck = {
  ready: boolean
  tables: StudioTableStatus[]
  migrationRequired?: string
  error?: string
}

function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key || url.includes('placeholder')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function fetchStudioSchemaSetup(): Promise<StudioSchemaCheck> {
  const client = getAdminClient()
  if (!client) {
    return {
      ready: false,
      tables: [],
      error: 'Supabase URL/key not configured',
    }
  }

  const tables: StudioTableStatus[] = []

  for (const table of STUDIO_SCHEMA_TABLES) {
    const { error } = await client.from(table).select('id', { head: true, count: 'exact' })
    if (error) {
      const missing =
        error.code === '42P01' ||
        error.message.includes('does not exist') ||
        error.message.includes('schema cache')
      tables.push({
        table,
        ok: false,
        error: error.message,
      })
      if (missing) {
        return {
          ready: false,
          tables,
          migrationRequired:
            'Apply supabase/migrations/20260529120000_studio_content_tables.sql and 20260529140000_studio_jobs_delivery_system.sql',
        }
      }
    } else {
      tables.push({ table, ok: true })
    }
  }

  return {
    ready: tables.every((t) => t.ok),
    tables,
  }
}
