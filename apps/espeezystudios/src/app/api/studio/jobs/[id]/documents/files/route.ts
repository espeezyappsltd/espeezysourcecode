import { NextResponse } from 'next/server'
import { requireStudioOperator } from '@/lib/auth/studio-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  STUDIO_JOB_DOCS_BUCKET,
  isTextDocument,
  jobDocumentStoragePath,
  listJobDocuments,
} from '@/lib/jobs/document-storage'
import type { JobDocumentKind } from '@/lib/jobs/types'

function parseKind(raw: FormDataEntryValue | null): JobDocumentKind | null {
  if (raw === 'requirements' || raw === 'prd') return raw
  return null
}

/** GET: list stored requirements / PRD files for a project */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await ctx.params

  let db
  try {
    db = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
  }

  const { data: job, error: jobErr } = await db.from('jobs').select('id').eq('id', jobId).maybeSingle()
  if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 })
  if (!job) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  try {
    const files = await listJobDocuments(db, jobId)
    const withUrls = await Promise.all(
      files.map(async (file) => {
        const { data } = await db.storage.from(STUDIO_JOB_DOCS_BUCKET).createSignedUrl(file.storage_path, 3600)
        return { ...file, downloadUrl: data?.signedUrl ?? null }
      }),
    )
    return NextResponse.json({ files: withUrls })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list files'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** POST multipart: upload requirements.txt or PRD.md */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStudioOperator()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { id: jobId } = await ctx.params
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 })
  }

  const kind = parseKind(form.get('kind'))
  const file = form.get('file')
  if (!kind) return NextResponse.json({ error: 'kind must be requirements or prd' }, { status: 400 })
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
  }

  const { data: job, error: jobErr } = await admin.from('jobs').select('id').eq('id', jobId).maybeSingle()
  if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 })
  if (!job) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const storagePath = jobDocumentStoragePath(jobId, kind, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType = file.type || (kind === 'prd' ? 'text/markdown' : 'text/plain')

  const { error: uploadErr } = await admin.storage.from(STUDIO_JOB_DOCS_BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: false,
  })
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: row, error: insertErr } = await admin
    .from('studio_job_documents')
    .insert({
      job_id: jobId,
      kind,
      storage_path: storagePath,
      filename: file.name,
      content_type: contentType,
      size_bytes: buffer.byteLength,
    })
    .select('*')
    .single()

  if (insertErr) {
    await admin.storage.from(STUDIO_JOB_DOCS_BUCKET).remove([storagePath])
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  if (isTextDocument(contentType)) {
    const text = buffer.toString('utf8')
    const column = kind === 'requirements' ? 'requirements_text' : 'prd_text'
    await admin.from('jobs').update({ [column]: text, updated_at: new Date().toISOString() }).eq('id', jobId)
  }

  const { data: signed } = await admin.storage.from(STUDIO_JOB_DOCS_BUCKET).createSignedUrl(storagePath, 3600)

  return NextResponse.json({
    file: { ...(row as object), downloadUrl: signed?.signedUrl ?? null },
  })
}

/** DELETE ?docId=: remove a stored file */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStudioOperator()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { id: jobId } = await ctx.params
  const docId = new URL(req.url).searchParams.get('docId')
  if (!docId) return NextResponse.json({ error: 'docId is required' }, { status: 400 })

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
  }

  const { data: doc, error: docErr } = await admin
    .from('studio_job_documents')
    .select('*')
    .eq('id', docId)
    .eq('job_id', jobId)
    .maybeSingle()

  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 })
  if (!doc) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  await admin.storage.from(STUDIO_JOB_DOCS_BUCKET).remove([doc.storage_path])
  const { error: delErr } = await admin.from('studio_job_documents').delete().eq('id', docId)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
