import Link from 'next/link'
import { BookOpen, Rocket, LayoutDashboard, Package } from 'lucide-react'
import {
  DOCS_HOME_INTRO,
  DOCS_ESSENTIAL_LINKS,
  ESPEEZY_APPS_IN_USE,
} from '@shared/platform-docs-content'
import { AppsInUseGrid } from '@/components/AppsInUseGrid'

const DOC_ICONS = [Rocket, Package, LayoutDashboard, BookOpen, BookOpen] as const

export default function DocsHomePage() {
  return (
    <div className="docs-content">
      <div className="docs-hero">
        <span className="docs-badge">Espeezy Docs</span>
        <h1 className="docs-title">Documentation</h1>
        <p className="docs-description">{DOCS_HOME_INTRO}</p>
      </div>

      <div className="docs-section">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#f3f4f6' }}>Apps in use</h2>
        <AppsInUseGrid apps={ESPEEZY_APPS_IN_USE} variant="docs" showDocsLink={false} />
        <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
          <Link href="/docs/apps" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
            View all apps including developer tools →
          </Link>
        </p>
      </div>

      <div className="docs-section">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#f3f4f6' }}>Start here</h2>
        <div className="docs-grid">
          {DOCS_ESSENTIAL_LINKS.map((s, i) => {
            const Icon = DOC_ICONS[i] ?? BookOpen
            return (
              <Link key={s.href} href={s.href} style={{ textDecoration: 'none' }}>
                <div className="docs-card">
                  <div style={{ color: '#10b981', marginBottom: '0.75rem', opacity: 0.8 }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.4rem', color: '#f3f4f6', fontSize: '0.95rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="docs-actions">
        <Link href="/docs/getting-started" className="docs-btn-primary">
          Quick start →
        </Link>
        <Link href="/" className="docs-btn-ghost">
          Back to espeezy.com
        </Link>
      </div>
    </div>
  )
}
