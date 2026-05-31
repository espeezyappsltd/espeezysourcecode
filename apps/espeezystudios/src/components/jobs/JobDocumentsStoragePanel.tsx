'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Settings, Trash2, Upload, X } from 'lucide-react'
import type { JobDocument, JobDocumentKind } from '@/lib/jobs/types'
import { useStudioEditor } from '@/hooks/useStudioEditor'

type StoredFile = JobDocument & { downloadUrl?: string | null }

type Props = {
  jobId: string
  onMutate?: () => void
}

const KIND_LABELS: Record<JobDocumentKind, string> = {
  requirements: 'requirements.txt',
  prd: 'PRD.md',
}

export function JobDocumentsStoragePanel({ jobId, onMutate }: Props) {
  const { canEdit } = useStudioEditor()
  const [gearOpen, setGearOpen] = useState(false)
  const [files, setFiles] = useState<StoredFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<JobDocumentKind | null>(null)
  const requirementsInput = useRef<HTMLInputElement>(null)
  const prdInput = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/studio/jobs/${jobId}/documents/files`, { credentials: 'include' })
      const body = (await res.json()) as { files?: StoredFile[]; error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Failed to load files')
      setFiles(body.files ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load files')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    if (gearOpen) void fetchFiles()
  }, [gearOpen, fetchFiles])

  async function upload(kind: JobDocumentKind, file: File) {
    setUploading(kind)
    setError(null)
    try {
      const form = new FormData()
      form.set('kind', kind)
      form.set('file', file)
      const res = await fetch(`/api/studio/jobs/${jobId}/documents/files`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Upload failed')
      await fetchFiles()
      onMutate?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  async function remove(docId: string) {
    if (!confirm('Delete this stored file?')) return
    setError(null)
    try {
      const res = await fetch(`/api/studio/jobs/${jobId}/documents/files?docId=${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Delete failed')
      await fetchFiles()
      onMutate?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (!canEdit) return null

  return (
    <section className={`studio-crud studio-crud--gear${gearOpen ? ' studio-crud--open' : ''} jobs-docs-storage`}>
      <div className="studio-crud__gear-bar">
        <button
          type="button"
          className={`studio-crud__gear${gearOpen ? ' is-active' : ''}`}
          aria-expanded={gearOpen}
          onClick={() => setGearOpen((open) => !open)}
        >
          <Settings size={18} aria-hidden />
          <span>Document file settings</span>
        </button>
        {gearOpen ? (
          <button type="button" className="studio-crud__gear-close" aria-label="Close settings" onClick={() => setGearOpen(false)}>
            <X size={16} />
          </button>
        ) : null}
      </div>

      {gearOpen ? (
        <div className="studio-crud__panel">
          <p className="studio-muted jobs-docs-storage__hint">
            Upload requirements.txt and PRD.md to Supabase Storage. Text content syncs to the editor below for delivery.
          </p>

          {error ? (
            <p className="studio-crud__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="jobs-docs-storage__uploads">
            {(['requirements', 'prd'] as const).map((kind) => (
              <div key={kind} className="jobs-docs-storage__upload">
                <span>{KIND_LABELS[kind]}</span>
                <input
                  ref={kind === 'requirements' ? requirementsInput : prdInput}
                  type="file"
                  accept={kind === 'prd' ? '.md,text/markdown,text/plain' : '.txt,text/plain'}
                  className="jobs-docs-storage__file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void upload(kind, file)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  className="studio-btn studio-btn--ghost"
                  disabled={uploading === kind}
                  onClick={() => (kind === 'requirements' ? requirementsInput : prdInput).current?.click()}
                >
                  <Upload size={16} aria-hidden />
                  {uploading === kind ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            ))}
          </div>

          {loading ? (
            <p className="studio-muted">Loading stored files…</p>
          ) : files.length === 0 ? (
            <p className="studio-muted">No stored files yet.</p>
          ) : (
            <ul className="studio-crud__list">
              {files.map((file) => (
                <li key={file.id} className="studio-crud__row">
                  <div className="studio-crud__row-body">
                    <strong>{file.filename}</strong>
                    {' · '}
                    {KIND_LABELS[file.kind]}
                    {' · '}
                    {(file.size_bytes / 1024).toFixed(1)} KB
                  </div>
                  <div className="studio-crud__row-actions">
                    {file.downloadUrl ? (
                      <a
                        href={file.downloadUrl}
                        className="studio-crud__icon-btn"
                        download={file.filename}
                        aria-label={`Download ${file.filename}`}
                      >
                        <Download size={15} />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="studio-crud__icon-btn studio-crud__icon-btn--danger"
                      aria-label="Delete file"
                      onClick={() => void remove(file.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}
