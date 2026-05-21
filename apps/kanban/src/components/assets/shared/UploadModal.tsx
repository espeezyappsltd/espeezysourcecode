'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { MAX_ASSET_CREDIT_VALUE, formatCreditCapHint } from '@/lib/credits'
import ModalOverlay from '@/components/ModalOverlay'
import { FormField } from '@/components/forms/FormField'
import type { VaultAsset } from './types'

export function UploadModal({
  currentFolder,
  onClose,
  onSuccess,
  showCreditField = true,
}: {
  currentFolder: string
  onClose: () => void
  onSuccess: (storage?: { storageUsed?: number; storageQuota?: number; tier?: string }) => void
  showCreditField?: boolean
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    asset_type: 'file' as VaultAsset['asset_type'],
    asset_url: '',
    category: '',
    credit_value: '0',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.title && !file) return setError('Title or file is required')
    if (form.asset_type === 'link' && !form.asset_url) return setError('URL is required for links')

    setLoading(true)
    setError('')

    try {
      let res: Response

      if (form.asset_type === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', form.title || file.name)
        formData.append('description', form.description)
        formData.append('category', form.category)
        formData.append('folder', currentFolder)
        formData.append('credit_value', form.credit_value || '0')
        res = await fetch('/api/assets', { method: 'POST', body: formData, credentials: 'include' })
      } else {
        res = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...form,
            folder: currentFolder,
            size_bytes: 0,
            credit_value: parseInt(form.credit_value, 10) || 0,
          }),
        })
      }

      const d = await res.json()
      if (res.ok) {
        onSuccess({
          storageUsed: d.storageUsed,
          storageQuota: d.storageQuota,
          tier: d.tier,
        })
      } else {
        setError(d.message || d.error || 'Failed to save asset')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay maxWidth="500px" onClickOutside={onClose} ariaLabel="Add asset">
      <div style={{ padding: '2rem' }}>
        <h2 id="assets-upload-modal-title" style={{ margin: '0 0 0.35rem', fontWeight: 950, color: 'var(--text-main)' }}>
          Add asset
        </h2>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: 'var(--text-sub)' }}>
          Saving to folder: <strong>{currentFolder === '/' ? 'Root' : currentFolder}</strong>
        </p>

        {error && (
          <motion.div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              padding: '0.75rem',
              borderRadius: 12,
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {error}
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 900,
                color: 'var(--text-sub)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
              }}
            >
              Asset type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, asset_type: 'file' }))}
                className={form.asset_type === 'file' ? 'btn btn-primary' : 'btn btn-secondary'}
              >
                File
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, asset_type: 'link' }))}
                className={form.asset_type === 'link' ? 'btn btn-primary' : 'btn btn-secondary'}
              >
                Link
              </button>
            </div>
          </div>

          {form.asset_type === 'file' ? (
            <FormField label="Upload file">
              <input
                type="file"
                className="form-input--file"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setFile(f)
                    if (!form.title) setForm((prev) => ({ ...prev, title: f.name }))
                  }
                }}
                style={{ width: '100%' }}
              />
            </FormField>
          ) : (
            <FormField label="Link URL">
              <input
                type="url"
                value={form.asset_url}
                onChange={(e) => setForm((f) => ({ ...f, asset_url: e.target.value }))}
                placeholder="https://..."
              />
            </FormField>
          )}

          <FormField label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Design System V1"
            />
          </FormField>

          <FormField label="Description (optional)">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief summary..."
              style={{ minHeight: 72, resize: 'none' }}
            />
          </FormField>

          {showCreditField && (
            <FormField label="Asset value (credits)" hint={`${formatCreditCapHint()} · 50 credits ≈ 1 month Pro`}>
              <input
                type="number"
                min={0}
                max={MAX_ASSET_CREDIT_VALUE}
                value={form.credit_value}
                onChange={(e) => setForm((f) => ({ ...f, credit_value: e.target.value }))}
              />
            </FormField>
          )}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="btn btn-primary"
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {form.asset_type === 'file' ? 'Upload & save' : 'Save link'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
