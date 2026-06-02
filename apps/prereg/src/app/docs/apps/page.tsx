import Link from 'next/link'
import { ESPEEZY_APPS_IN_USE, ESPEEZY_DEVELOPER_APPS } from '@shared/platform-docs-content'
import { AppsInUseGrid } from '@/components/AppsInUseGrid'

export default function DocsAppsPage() {
  return (
    <div className="docs-content">
      <span className="docs-badge">Apps in use</span>
      <h1 className="docs-title">Live Espeezy apps</h1>
      <p className="docs-description">
        These are the hosted products you can open today. Use one Espeezy login across Kanban, Games, Studio, and
        Articles.
      </p>

      <div className="docs-section" style={{ marginTop: '2rem' }}>
        <AppsInUseGrid apps={ESPEEZY_APPS_IN_USE} variant="docs" showDocsLink />
      </div>

      <div className="docs-section" style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f3f4f6' }}>For developers</h2>
        <p className="docs-description" style={{ marginBottom: '1rem' }}>
          Self-host packages, setup guides, and internal hub access.
        </p>
        <AppsInUseGrid apps={ESPEEZY_DEVELOPER_APPS} variant="docs" />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #222' }}>
        <Link href="/docs" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Documentation home
        </Link>
        <Link href="/docs/getting-started" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, marginLeft: 'auto' }}>
          Quick start →
        </Link>
      </div>
    </div>
  )
}
