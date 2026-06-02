import type { SupabaseClient } from '@supabase/supabase-js'
import type { JobBundle } from '@/lib/jobs/types'
import { generatePrdMarkdown, generateRequirementsTxt } from '@/lib/jobs/documents'
import { readLatestJobDocumentText } from '@/lib/jobs/document-storage'

export async function resolveRequirementsContent(db: SupabaseClient, bundle: JobBundle): Promise<string> {
  const fromDb = bundle.job.requirements_text?.trim()
  if (fromDb) return fromDb
  const fromStorage = await readLatestJobDocumentText(db, bundle.job.id, 'requirements')
  if (fromStorage?.trim()) return fromStorage.trim()
  return generateRequirementsTxt(bundle)
}

export async function resolvePrdContent(db: SupabaseClient, bundle: JobBundle): Promise<string> {
  const fromDb = bundle.job.prd_text?.trim()
  if (fromDb) return fromDb
  const fromStorage = await readLatestJobDocumentText(db, bundle.job.id, 'prd')
  if (fromStorage?.trim()) return fromStorage.trim()
  return generatePrdMarkdown(bundle)
}
