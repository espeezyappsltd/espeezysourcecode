'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import type { PlatformApp, PlatformAppStatus } from '@shared/platform-apps'

const STATUSES: PlatformAppStatus[] = ['live', 'beta', 'development', 'coming_soon']

const EMPTY_DRAFT: Partial<PlatformApp> = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  status: 'development',
  price_cents: 0,
  price_currency: 'GBP',
  price_label: '',
  stripe_payment_link: '',
  download_url: '',
  live_url: '',
  icon_key: 'layout',
  accent_color: '#6366f1',
  features: [],
  db_setup_markdown: '',
  ui_customization_markdown: '',
  includes_source: true,
  sort_order: 0,
  published: true,
}

export default function PlatformAppsPanel() {
  const [apps, setApps] = useState<PlatformApp[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<PlatformApp>>(EMPTY_DRAFT)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/platform-apps')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setApps(data.apps ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selectApp = (app: PlatformApp) => {
    setSelectedId(app.id)
    setDraft({
      ...app,
      features: [...app.features],
      stripe_payment_link: app.stripe_payment_link ?? '',
      download_url: app.download_url ?? '',
      live_url: app.live_url ?? '',
    })
  }

  const startCreate = () => {
    setSelectedId(null)
    setDraft({ ...EMPTY_DRAFT, features: [] })
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const featuresText = (draft as { featuresText?: string }).featuresText
      const payload = {
        ...draft,
        features: featuresText
          ? featuresText.split('\n').map((s) => s.trim()).filter(Boolean)
          : draft.features ?? [],
        price_cents: Number(draft.price_cents ?? 0),
        sort_order: Number(draft.sort_order ?? 0),
        stripe_payment_link: draft.stripe_payment_link || null,
        download_url: draft.download_url || null,
        live_url: draft.live_url || null,
      }
      delete (payload as { featuresText?: string }).featuresText

      const res = selectedId
        ? await fetch(`/api/admin/platform-apps/${selectedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/platform-apps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      await load()
      if (data.app) selectApp(data.app)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
    setSaving(false)
  }

  const remove = async () => {
    if (!selectedId || !confirm('Delete this app listing?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/platform-apps/${selectedId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      startCreate()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
    setSaving(false)
  }

  const featuresText =
    (draft as { featuresText?: string }).featuresText ??
    (draft.features ?? []).join('\n')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 280px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
      <div className="studio-dashboard-card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <strong>Catalog</strong>
          <button type="button" className="studio-dashboard-btn" onClick={startCreate} title="New app">
            <Plus size={16} aria-hidden />
          </button>
        </div>
        {loading && <p className="studio-dashboard-muted">Loading…</p>}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {apps.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                onClick={() => selectApp(app)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 8,
                  border: selectedId === app.id ? '1px solid var(--brand, #6366f1)' : '1px solid transparent',
                  background: selectedId === app.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {app.name}
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>{app.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="studio-dashboard-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem' }}>{selectedId ? 'Edit app' : 'New app'}</h3>
        {error && (
          <p role="alert" style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <label>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Slug</span>
            <input
              className="studio-dashboard-input"
              value={draft.slug ?? ''}
              disabled={Boolean(selectedId)}
              onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
            />
          </label>
          <label>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Name</span>
            <input
              className="studio-dashboard-input"
              value={draft.name ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Status</span>
            <select
              className="studio-dashboard-input"
              value={draft.status ?? 'development'}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as PlatformAppStatus }))}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Price (cents)</span>
            <input
              type="number"
              className="studio-dashboard-input"
              value={draft.price_cents ?? 0}
              onChange={(e) => setDraft((d) => ({ ...d, price_cents: Number(e.target.value) }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Price label (display)</span>
            <input
              className="studio-dashboard-input"
              value={draft.price_label ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, price_label: e.target.value }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Tagline</span>
            <input
              className="studio-dashboard-input"
              value={draft.tagline ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Description</span>
            <textarea
              className="studio-dashboard-input"
              rows={3}
              value={draft.description ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Stripe payment link</span>
            <input
              className="studio-dashboard-input"
              value={draft.stripe_payment_link ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, stripe_payment_link: e.target.value }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Download URL</span>
            <input
              className="studio-dashboard-input"
              value={draft.download_url ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, download_url: e.target.value }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Live hosted URL</span>
            <input
              className="studio-dashboard-input"
              value={draft.live_url ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, live_url: e.target.value }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Features (one per line)</span>
            <textarea
              className="studio-dashboard-input"
              rows={4}
              value={featuresText}
              onChange={(e) => setDraft((d) => ({ ...d, featuresText: e.target.value }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>DB setup (markdown)</span>
            <textarea
              className="studio-dashboard-input"
              rows={5}
              value={draft.db_setup_markdown ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, db_setup_markdown: e.target.value }))}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>UI personalisation (markdown)</span>
            <textarea
              className="studio-dashboard-input"
              rows={5}
              value={draft.ui_customization_markdown ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, ui_customization_markdown: e.target.value }))}
            />
          </label>
          <label>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Sort order</span>
            <input
              type="number"
              className="studio-dashboard-input"
              value={draft.sort_order ?? 0}
              onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))}
            />
          </label>
          <label>
            <span className="studio-dashboard-muted" style={{ fontSize: '0.75rem' }}>Accent</span>
            <input
              className="studio-dashboard-input"
              value={draft.accent_color ?? '#6366f1'}
              onChange={(e) => setDraft((d) => ({ ...d, accent_color: e.target.value }))}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={draft.published ?? true}
              onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
            />
            Published on landing
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button type="button" className="studio-dashboard-btn studio-dashboard-btn--primary" disabled={saving} onClick={() => void save()}>
            <Save size={16} aria-hidden /> {saving ? 'Saving…' : 'Save'}
          </button>
          {selectedId && (
            <button type="button" className="studio-dashboard-btn" disabled={saving} onClick={() => void remove()}>
              <Trash2 size={16} aria-hidden /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
