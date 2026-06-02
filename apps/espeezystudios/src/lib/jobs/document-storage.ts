import type { SupabaseClient } from '@supabase/supabase-js'
import type { JobDocument, JobDocumentKind } from '@/lib/jobs/types'

export const STUDIO_JOB_DOCS_BUCKET = 'studio-job-docs'

export function jobDocumentStoragePath(jobId: string, kind: JobDocumentKind, filename: string): string {
  const safeName = filename.replace(/[^\w.\-() ]+/g, '_')
  return `${jobId}/${kind}/${Date.now()}-${safeName}`
}

export async function listJobDocuments(db: SupabaseClient, jobId: string): Promise<JobDocument[]> {
  const { data, error } = await db
    .from('studio_job_documents')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as JobDocument[]
}

export async function readLatestJobDocumentText(
  db: SupabaseClient,
  jobId: string,
  kind: JobDocumentKind,
): Promise<string | null> {
  const { data, error } = await db
    .from('studio_job_documents')
    .select('*')
    .eq('job_id', jobId)
    .eq('kind', kind)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null

  const doc = data as JobDocument
  const { data: blob, error: dlErr } = await db.storage.from(STUDIO_JOB_DOCS_BUCKET).download(doc.storage_path)
  if (dlErr || !blob) return null
  return blob.text()
}

export function isTextDocument(contentType: string | null | undefined): boolean {
  if (!contentType) return true
  return (
    contentType.startsWith('text/') ||
    contentType.includes('markdown') ||
    contentType === 'application/octet-stream'
  )
}
