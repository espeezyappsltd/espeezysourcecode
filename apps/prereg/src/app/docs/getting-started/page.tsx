import Link from 'next/link'
import {
  GETTING_STARTED_STEP_1_DESC,
  GETTING_STARTED_STEP_1_TITLE,
  MAIN_APP_ORIGIN,
} from '@shared/platform-brand'
import { ESPEEZY_APPS_IN_USE } from '@shared/platform-docs-content'
import { AppsInUseGrid } from '@/components/AppsInUseGrid'

export default function GettingStartedPage() {
  const steps = [
    { step: '01', title: GETTING_STARTED_STEP_1_TITLE, desc: GETTING_STARTED_STEP_1_DESC },
    { step: '02', title: 'Invite your team', desc: 'Share your team name and join code so everyone lands on the same board.' },
    { step: '03', title: 'Add tasks and work', desc: 'Create tasks, assign them, and move cards as the project progresses.' },
    { step: '04', title: 'Review contribution', desc: 'Use project stats and exports when you need to show who did what.' },
  ]

  return (
    <div className="docs-content">
      <h1 className="docs-title">Quick start</h1>
      <p className="docs-description">
        Open Kanban first, then use the other apps with the same login when you need them.
      </p>

      <div className="docs-section" style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f3f4f6' }}>Apps in use</h2>
        <AppsInUseGrid apps={ESPEEZY_APPS_IN_USE} variant="docs" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '2.5rem 0' }}>
        {steps.map((s) => (
          <div key={s.step} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div
              style={{
                flexShrink: 0,
                width: '40px',
                height: '40px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: '#10b981',
              }}
            >
              {s.step}
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem', color: '#f3f4f6' }}>{s.title}</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.6, fontSize: '0.9rem', margin: 0 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginBottom: '2rem' }}>
        <a
          href={MAIN_APP_ORIGIN}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}
        >
          Open Espeezy Kanban →
        </a>
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
        <Link href="/docs" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Docs home
        </Link>
        <Link href="/docs/features/kanban" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, marginLeft: 'auto' }}>
          Kanban guide →
        </Link>
      </div>
    </div>
  )
}
