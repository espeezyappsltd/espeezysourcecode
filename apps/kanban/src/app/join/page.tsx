'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { createGroup, joinGroup } from '@/app/join/actions'

function JoinPageContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const [mode, setMode] = useState<'create' | 'join'>('join')

  return (
    <div className="page-fade page-shell page-shell--narrow" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <Users size={36} style={{ color: 'var(--brand)', marginBottom: '0.75rem' }} aria-hidden />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.35rem' }}>Team workspace</h1>
        <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
          Create a new group or join with your module code.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--error)',
            fontSize: '0.85rem',
          }}
        >
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          marginBottom: '1.25rem',
          padding: '0.35rem',
          background: 'var(--bg-sub)',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          className={`btn btn-sm btn-inline${mode === 'join' ? ' btn-primary' : ' btn-ghost'}`}
          style={{ flex: 1 }}
          onClick={() => setMode('join')}
        >
          Join team
        </button>
        <button
          type="button"
          className={`btn btn-sm btn-inline${mode === 'create' ? ' btn-primary' : ' btn-ghost'}`}
          style={{ flex: 1 }}
          onClick={() => setMode('create')}
        >
          Create team
        </button>
      </div>

      {mode === 'join' ? (
        <form action={joinGroup} className="auth-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label htmlFor="create_module_code" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Module code
          </label>
          <input id="create_module_code" name="module_code" required className="input" placeholder="e.g. MOD-CS101" />

          <label htmlFor="join_password" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Join password
          </label>
          <input
            id="join_password"
            name="join_password"
            type="password"
            className="input"
            placeholder="From your team lead"
            autoComplete="current-password"
          />

          <button type="submit" className="btn btn-primary">
            Join Team
          </button>
        </form>
      ) : (
        <form action={createGroup} className="auth-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label htmlFor="name" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Team name
          </label>
          <input id="name" name="name" required className="input" placeholder="e.g. Alpha Project Team" />

          <label htmlFor="module_code" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Module code
          </label>
          <input id="module_code" name="module_code" required className="input" placeholder="Unique code for teammates" />

          <label htmlFor="create_join_password" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Join password
          </label>
          <input
            id="create_join_password"
            name="join_password"
            type="password"
            required
            className="input"
            placeholder="Share with your team"
            autoComplete="new-password"
          />

          <label htmlFor="capacity" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Team capacity
          </label>
          <input id="capacity" name="capacity" type="number" min={2} max={20} defaultValue={5} className="input" />

          <button type="submit" className="btn btn-primary">
            Create Workspace
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
        <Link href="/" className="landing-inline-link">
          Back to board
        </Link>
      </p>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="page-shell page-fade">Loading…</div>}>
      <JoinPageContent />
    </Suspense>
  )
}
