'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronRight } from 'lucide-react'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  const sections = [
    {
      title: 'Getting Started',
      items: [
        { label: 'Introduction', href: '/docs' },
        { label: 'Quick Start', href: '/docs/getting-started' },
        { label: 'Installation', href: '/docs/installation' },
      ],
    },
    {
      title: 'Features (ELI12)',
      items: [
        { label: 'Kanban Boards', href: '/docs/features/kanban' },
        { label: 'Academic Roadmap', href: '/docs/features/roadmap' },
        { label: 'Peer Network', href: '/docs/features/network' },
        { label: 'Marketplace', href: '/docs/features/marketplace' },
        { label: 'Skirmish Games', href: '/docs/features/skirmish' },
        { label: 'Smart Search', href: '/docs/features/search' },
      ],
    },
    {
      title: 'Infrastructure',
      items: [
        { label: 'Stripe Integration', href: '/docs/infra/payments' },
        { label: 'Firebase Sync', href: '/docs/infra/sync' },
        { label: 'Real-time Presence', href: '/docs/infra/presence' },
      ],
    },
    {
      title: 'Vision',
      items: [
        { label: 'Our Vision', href: '/docs/vision' },
        { label: 'Impact Stats', href: '/docs/impact' },
      ],
    },
  ]

  return (
    <div className="docs-container">
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 850 }}
        />
      )}

      <header className="docs-header">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#f3f4f6' }}>
          <div style={{ width: '28px', height: '28px', background: '#10b981', borderRadius: '6px' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>Espeezy <span style={{ color: '#666', fontWeight: 500 }}>Docs</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600 }} className="hide-mobile">
            ← Back to site
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hide-desktop"
            style={{ background: 'none', border: 'none', color: '#f3f4f6', cursor: 'pointer', padding: 0 }}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div className="docs-layout">
        <aside className={`docs-sidebar${isSidebarOpen ? ' open' : ''}`}>
          {sections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '2.5rem' }}>
              <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b7280', marginBottom: '0.875rem', margin: '0 0 0.875rem' }}>
                {section.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {section.items.map((item, i) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={i}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      style={{
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        color: active ? '#10b981' : '#9ca3af',
                        fontWeight: active ? 700 : 500,
                        padding: '0.35rem 0',
                        transition: 'color 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      className="docs-link"
                    >
                      {item.label}
                      {active && <ChevronRight size={14} />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </aside>

        <main className="docs-main">
          <div className="docs-content-inner">{children}</div>
        </main>
      </div>
    </div>
  )
}
