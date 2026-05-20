'use client'

import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowRight, BookOpen, LayoutDashboard } from 'lucide-react'
import { BOARD_PREVIEW, HOME_HIGHLIGHTS, QUICK_ACTIONS, USER_GUIDE_SECTIONS } from './content'
import './kanban-home.css'

type Props = {
  user: User | null
  registeredCount: number | null
  onLogout: () => Promise<void>
}

function openUserGuide() {
  window.dispatchEvent(new CustomEvent('open-kanban-user-guide'))
}

export function KanbanHomeView({ user, registeredCount, onLogout }: Props) {
  const workspaceHref = user ? '/dashboard' : '/login?next=/dashboard'

  return (
    <div className="kanban-home">
      <a href="#main-content" className="kanban-home-skip">
        Skip to main content
      </a>

      <header className="kanban-home-nav">
        <Link href="/" className="kanban-home-brand" aria-label="Espeezy Kanban Home">
          <span className="kanban-home-brand-name">espeezy</span>
          <span className="kanban-home-badge">Kanban</span>
        </Link>
        <nav className="kanban-home-nav-actions" aria-label="Primary">
          <button type="button" className="kanban-home-btn kanban-home-btn--ghost" onClick={openUserGuide}>
            <BookOpen size={16} aria-hidden />
            User guide
          </button>
          {user ? (
            <Link href={workspaceHref} className="kanban-home-btn kanban-home-btn--primary">
              <LayoutDashboard size={16} aria-hidden />
              Open workspace
            </Link>
          ) : (
            <Link href="/login?next=/dashboard" className="kanban-home-btn kanban-home-btn--primary">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <section className="kanban-home-account" aria-label="Account">
        <div className="kanban-home-account-inner">
          {user ? (
            <>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-sub)' }}>
                Signed in as <strong style={{ color: 'var(--text-main)' }}>{user.email}</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link href={workspaceHref} className="kanban-home-btn kanban-home-btn--primary">
                  Open workspace
                </Link>
                <button type="button" className="kanban-home-btn kanban-home-btn--ghost" onClick={() => void onLogout()}>
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-sub)' }}>
                Sign in to open your team board, tasks, and live collaboration.
              </p>
              <Link href="/login?next=/dashboard" className="kanban-home-btn kanban-home-btn--primary">
                Sign in to Espeezy
              </Link>
            </>
          )}
        </div>
      </section>

      <main id="main-content">
        <section className="kanban-home-hero" aria-labelledby="kanban-home-heading">
          <p className="kanban-home-eyebrow">Dashboard · Kanban Home</p>
          <h1 id="kanban-home-heading" className="kanban-home-title">
            Welcome to your Kanban workspace
          </h1>
          <p className="kanban-home-lead">
            Your academic command center for boards, deadlines, team accountability, and real-time collaboration,
            designed for students and project teams who need clarity, not clutter.
          </p>
          <div className="kanban-home-hero-actions">
            <Link href={workspaceHref} className="kanban-home-btn kanban-home-btn--primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
              <LayoutDashboard size={18} aria-hidden />
              {user ? 'Enter workspace' : 'Sign in & open workspace'}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <button type="button" className="kanban-home-btn kanban-home-btn--ghost" style={{ padding: '0.75rem 1.5rem' }} onClick={openUserGuide}>
              <BookOpen size={18} aria-hidden />
              Read full user guide
            </button>
          </div>
          <div className="kanban-home-stats" role="list" aria-label="Platform highlights">
            {[
              {
                value: registeredCount === null ? '—' : new Intl.NumberFormat('en-US').format(registeredCount),
                label: 'Community members',
              },
              { value: '4', label: 'Board columns' },
              { value: 'Live', label: 'Team sync' },
              { value: 'WCAG', label: 'AA accessible' },
            ].map(({ value, label }) => (
              <div key={label} role="listitem" style={{ textAlign: 'center' }}>
                <div className="kanban-home-stat-value">{value}</div>
                <div className="kanban-home-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="kanban-home-section" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="kanban-home-section-title">
            Quick actions
          </h2>
          <div className="kanban-home-quick-grid">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              const isGuide = action.id === 'guide'
              const isA11y = action.id === 'a11y'
              const isLogin = action.id === 'login' && user

              if (isLogin) return null

              const className = `kanban-home-quick-card${action.primary ? ' kanban-home-quick-card--primary' : ''}`

              if (isGuide) {
                return (
                  <button key={action.id} type="button" className={className} onClick={openUserGuide}>
                    <span className="kanban-home-quick-icon" aria-hidden>
                      <Icon size={20} />
                    </span>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </button>
                )
              }

              if (isA11y) {
                return (
                  <a key={action.id} href={action.href} className={className}>
                    <span className="kanban-home-quick-icon" aria-hidden>
                      <Icon size={20} />
                    </span>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </a>
                )
              }

              const href = action.id === 'workspace' ? workspaceHref : action.href
              return (
                <Link key={action.id} href={href} className={className}>
                  <span className="kanban-home-quick-icon" aria-hidden>
                    <Icon size={20} />
                  </span>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="kanban-home-section" aria-label="Board preview">
          <h2 className="kanban-home-section-title">Your board at a glance</h2>
          <div className="kanban-home-board-preview" aria-hidden="true">
            {BOARD_PREVIEW.map(({ column, cards, color }) => (
              <div key={column}>
                <p className="kanban-home-column-title" style={{ color }}>
                  {column}
                </p>
                {cards.map((card) => (
                  <div key={card} className="kanban-home-card-chip" style={{ borderLeftColor: color }}>
                    {card}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '0.75rem' }}>
            Interactive board available in your workspace after sign-in.
          </p>
        </section>

        <section className="kanban-home-section" aria-labelledby="features-heading">
          <h2 id="features-heading" className="kanban-home-section-title">
            Built for academic teams
          </h2>
          <div className="kanban-home-highlights">
            {HOME_HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <article key={title} className="kanban-home-highlight">
                <span className="kanban-home-quick-icon" aria-hidden>
                  <Icon size={20} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="user-guide" className="kanban-home-section kanban-home-guide-embed" aria-labelledby="embedded-guide-heading">
          <h2 id="embedded-guide-heading" className="kanban-home-section-title">
            User guide
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-sub)', maxWidth: '560px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Everything you need to navigate Kanban Home, customize accessibility, and run your team board.
            Open the full guide for keyboard shortcuts and detailed walkthroughs.
          </p>
          <button type="button" className="kanban-home-btn kanban-home-btn--primary" style={{ display: 'flex', margin: '0 auto 1.5rem' }} onClick={openUserGuide}>
            Open full user guide
          </button>
          <div className="kanban-home-guide-list">
            {USER_GUIDE_SECTIONS.map((section) => (
              <details key={section.id} className="kanban-home-guide-item">
                <summary>{section.title}</summary>
                <div className="kanban-home-guide-content">
                  <p>{section.summary}</p>
                  <ol>
                    {section.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
