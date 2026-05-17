'use client'

import { useState } from 'react'
import { AssetSchema, createMarketplaceAsset } from '@/services/marketplace'
import { formatCreditCapHint, MAX_ASSET_CREDIT_VALUE } from '@/lib/credits'
import { z } from 'zod'

const CATEGORIES = [
  'Graphics', 'Logos', 'Templates', 'Icons', 'UI Kits', 'Mockups', '3D', 'Fonts', 'Other'
]

export default function MarketplaceAssetUploader({ onUpload }: { onUpload?: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    asset_url: '',
    preview_url: '',
    tags: '',
    price: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const parsed = AssetSchema.omit({ id: true, user_id: true, created_at: true, updated_at: true, is_featured: true }).safeParse({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      price: form.price ? Number(form.price) : undefined,
    })
    if (!parsed.success) {
      const issue = parsed.error.issues?.[0]
      setError(
        issue?.message ||
          (issue?.code === 'too_big'
            ? `Price cannot exceed ${MAX_ASSET_CREDIT_VALUE} credits (2 months Pro).`
            : 'Invalid input'),
      )
      setSubmitting(false)
      return
    }
    try {
      await createMarketplaceAsset(parsed.data)
      setForm({ title: '', description: '', category: '', asset_url: '', preview_url: '', tags: '', price: '' })
      if (onUpload) onUpload()
    } catch (err) {
      setError('Failed to upload asset')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(20,20,30,0.95)', borderRadius: 16, padding: 32, maxWidth: 480, margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
      <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: 16 }}>Upload Digital Asset</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input required placeholder='Title' value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #222', background: '#181828', color: 'white', fontWeight: 700 }} />
        <textarea placeholder='Description' value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #222', background: '#181828', color: 'white', fontWeight: 500, minHeight: 60 }} />
        <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #222', background: '#181828', color: 'white', fontWeight: 700 }}>
          <option value=''>Select Category</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input required placeholder='Asset File URL' value={form.asset_url} onChange={e => setForm(f => ({ ...f, asset_url: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #222', background: '#181828', color: 'white', fontWeight: 700 }} />
        <input placeholder='Preview Image URL' value={form.preview_url} onChange={e => setForm(f => ({ ...f, preview_url: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #222', background: '#181828', color: 'white', fontWeight: 700 }} />
        <input placeholder='Tags (comma separated)' value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #222', background: '#181828', color: 'white', fontWeight: 700 }} />
        <input placeholder={`Credit price (0–${MAX_ASSET_CREDIT_VALUE}, blank = free)`} type='number' min='0' max={MAX_ASSET_CREDIT_VALUE} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #222', background: '#181828', color: 'white', fontWeight: 700 }} />
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{formatCreditCapHint()} · 50 credits ≈ 1 month Pro</p>
        {error && <div style={{ color: '#ff4d4f', fontWeight: 700 }}>{error}</div>}
        <button type='submit' disabled={submitting} style={{ padding: 14, borderRadius: 8, background: 'linear-gradient(90deg, #10b981 0%, #6366f1 100%)', color: 'white', fontWeight: 900, fontSize: '1rem', border: 'none', marginTop: 8, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>Upload Asset</button>
      </div>
    </form>
  )
}
