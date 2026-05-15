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
        { label: 'Side Hustle', href: '/docs/features/hustle' },
        { label: 'Skirmish Games', href: '/docs/features/skirmish' },
        { label: 'Smart Search', href: '/docs/features/search' },
      ],
    },
    {
      title: 'Infrastructure',
      items: [
        { label: 'Stripe Integration', href: '/docs/infra/payments' },
        { label: 'Supabase Sync', href: '/docs/infra/sync' },
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

      <style jsx>{`
        .docs-container {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f3f4f6;
        }

        .docs-header {
          height: 64px;
          border-bottom: 1px solid #222;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(12px);
        }

        .docs-layout {
          display: flex;
          max-width: 1440px;
          margin: 0 auto;
          position: relative;
        }

        .docs-sidebar {
          width: 260px;
          flex-shrink: 0;
          height: calc(100vh - 64px);
          border-right: 1px solid #222;
          padding: 2rem 1.5rem;
          position: sticky;
          top: 64px;
          overflow-y: auto;
          background: #0a0a0a;
        }

        .docs-main {
          flex: 1;
          min-width: 0;
          padding: 3rem 4rem;
          background: #0a0a0a;
        }

        .docs-content-inner {
          max-width: 860px;
        }

        .docs-link:hover {
          color: #f3f4f6 !important;
        }

        .hide-mobile {
          display: block;
        }

        .hide-desktop {
          display: none !important;
        }

        @media (max-width: 1024px) {
          .docs-header {
            padding: 0 1.25rem;
          }

          .docs-sidebar {
            position: fixed;
            left: -100%;
            top: 64px;
            z-index: 900;
            transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            width: 280px;
            max-width: 85vw;
            box-shadow: 20px 0 50px rgba(0, 0, 0, 0.5);
            height: calc(100vh - 64px);
          }

          .docs-sidebar.open {
            left: 0;
          }

          .docs-main {
            padding: 2rem 1.25rem;
          }

          .hide-mobile {
            display: none;
          }

          .hide-desktop {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
