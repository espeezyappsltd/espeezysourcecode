'use client'

import { ExternalLink, FileUp, Link as LinkIcon, ThumbsUp, Trash2 } from 'lucide-react'
import type { UseTaskModalReturn } from './useTaskModal'
import { FormField } from '@/components/forms/FormField'

export type TaskModalEvidenceProps = Pick<
  UseTaskModalReturn,
  | 'evidenceLoading'
  | 'uploading'
  | 'artifacts'
  | 'newUrl'
  | 'setNewUrl'
  | 'currentUser'
  | 'task'
  | 'handleUploadEvidence'
  | 'handlePhysicalUpload'
  | 'handleDeleteArtifact'
  | 'handleEndorse'
>

export function TaskModalEvidence({
  evidenceLoading,
  uploading,
  artifacts,
  newUrl,
  setNewUrl,
  currentUser,
  task,
  handleUploadEvidence,
  handlePhysicalUpload,
  handleDeleteArtifact,
  handleEndorse,
}: TaskModalEvidenceProps) {
  if (!task) return null

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <LinkIcon size={16} color="var(--brand)" aria-hidden />
        <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>Evidence & Links</h3>
      </div>
      <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
        Add verifiable work links or architectural proof.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <FormField label="Evidence URL" hint="Figma, Docs, GitHub, or other proof link">
            <input type="url" placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleUploadEvidence}
            disabled={uploading || !newUrl}
            style={{ flex: 1, minHeight: 44 }}
          >
            {uploading ? 'Adding...' : 'Attach'}
          </button>
          <div style={{ position: 'relative', flex: 1 }}>
            <label
              htmlFor="task-evidence-file"
              className="btn btn-ghost btn-sm"
              style={{
                width: '100%',
                borderColor: 'var(--brand)',
                color: 'var(--brand)',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              <FileUp size={14} aria-hidden /> Upload file
            </label>
            <input
              id="task-evidence-file"
              type="file"
              onChange={handlePhysicalUpload}
              disabled={uploading}
              className="sr-only"
            />
          </div>
        </div>
      </div>

      <div>
        {evidenceLoading || uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1].map((i) => (
              <div key={i} className="skeleton" style={{ height: '50px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : artifacts.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-sub)',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
            }}
          >
            <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>No verifiable evidence attached yet.</p>
          </div>
        ) : (
          artifacts.map((artifact) => {
            const isOwner = currentUser?.id === artifact.uploaded_by
            return (
              <div
                key={artifact.id}
                className="artifact-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.5rem',
                  background: 'var(--bg-main)',
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                  <a
                    href={artifact.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    <ExternalLink size={12} aria-hidden />
                    View Attachment
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEndorse(artifact.id, artifact.endorsements_count)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    aria-label={`Endorse, ${artifact.endorsements_count} endorsements`}
                  >
                    <ThumbsUp size={12} aria-hidden />
                    {artifact.endorsements_count}
                  </button>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeleteArtifact(artifact.id)}
                      aria-label="Delete attachment"
                      style={{ background: 'none', border: 'none', color: 'var(--error)', padding: '4px', cursor: 'pointer', minWidth: 44, minHeight: 44 }}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
