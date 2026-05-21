"use client"

import { GAMES_LANDING_CTA_BODY } from '@/lib/platform/brand-copy'
import LiveChatWidget from '@/components/LiveChatWidget'
import CategoriesGamesSection from '@/components/CategoriesGamesSection'
import { useGamesLanding } from '@/hooks/useGamesLanding'
import { useCategoriesWithGames } from '@/hooks/useCategoriesWithGames'
import { useKanbanWorkspaceLink } from '@/hooks/useKanbanWorkspaceLink'
import features from '@/data/features.json'

export default function HomePage() {
  const {
    email,
    handleLogout,
    handleNotify,
    setEmail,
    status,
    user,
  } = useGamesLanding()

  const { categories, loading, error } = useCategoriesWithGames()
  const kanbanWorkspaceUrl = useKanbanWorkspaceLink()

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a' }}>
      {/* Skip link */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: '-100%',
          left: '0.5rem',
          zIndex: 99999,
          padding: '0.5rem 1rem',
          background: '#10b981',
          color: 'white',
          fontWeight: 700,
          borderRadius: '0 0 8px 8px',
          textDecoration: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.top = '0' }}
        onBlur={(e) => { e.currentTarget.style.top = '-100%' }}
      >
        Skip to content
      </a>
      <section
        aria-label="Account access"
        style={{
          maxWidth: '980px',
          margin: '1rem auto 0',
          padding: '0 1rem',
        }}
      >
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '12px',
            padding: '0.9rem 1rem',
          }}
        >
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
                Logged in as <strong style={{ color: '#0f172a' }}>{user.email}</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href="/profile"
                  style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  My Games profile
                </a>
                <a
                  href={kanbanWorkspaceUrl}
                  style={{ color: '#059669', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  Open Kanban
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(15, 23, 42, 0.2)',
                    background: 'transparent',
                    color: '#0f172a',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <form onSubmit={handleNotify} style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', width: '100%' }}>
                <label htmlFor="games-email" className="sr-only">Email address</label>
                <input
                  id="games-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email to get notified"
                  style={{
                    flex: 1,
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '1rem',
                  }}
                  required
                  autoComplete="email"
                  aria-describedby={status === 'error' ? 'notify-error' : undefined}
                />
                <button
                  type="submit"
                  style={{
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1.2rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                  disabled={status === 'loading'}
                >
                  Notify Me
                </button>
              </form>
              {status === 'error' && (
                <p id="notify-error" role="alert" aria-live="assertive" style={{ width: '100%', textAlign: 'center', color: '#dc2626', fontSize: '0.85rem' }}>
                  Something went wrong. Please try again.
                </p>
              )}
              {status === 'done' && (
                <p role="status" aria-live="polite" style={{ width: '100%', textAlign: 'center', color: '#059669', fontSize: '0.85rem' }}>
                  You’ll be notified when games launch!
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Hero */}
      <section
        id="main-content"
        style={{
          padding: 'clamp(5rem, 12vw, 9rem) clamp(1rem, 5vw, 2.5rem) clamp(4rem, 8vw, 6rem)',
          textAlign: 'center',
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        }}
      >
        <p
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '0.3rem 0.9rem',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: '1.5rem',
          }}
        >
          Coming Soon
        </p>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #059669 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Learning is<br />a game now.
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: '#475569',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            lineHeight: 1.7,
          }}
        >
          Real-time skirmishes, ranked leagues, and co-op boss battles tied directly to your curriculum.
          Espeezy Games turns studying into something you actually want to do.
        </p>

        {/* Notify form */}
        {status === 'done' ? (
          <div
            role="status"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '1rem 2rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: '#10b981',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            You are in the list
          </div>
        ) : (
          <form
            onSubmit={handleNotify}
            style={{
              display: 'flex',
              gap: '0.75rem',
              maxWidth: '480px',
              margin: '0 auto',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <label htmlFor="games-email" className="sr-only">Email address</label>
            <input
              id="games-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={status === 'loading'}
              style={{
                flex: '1 1 220px',
                minWidth: 0,
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid rgba(15, 23, 42, 0.12)',
                background: 'rgba(16, 185, 129, 0.06)',
                color: '#0f172a',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '0.85rem 1.75rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: status === 'loading' ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: status === 'loading' ? 0.7 : 1,
              }}
            >
              {status === 'loading' ? 'Joining…' : 'Notify Me'}
            </button>
            {status === 'error' && (
              <p role="alert" style={{ width: '100%', textAlign: 'center', color: '#dc2626', fontSize: '0.85rem' }}>
                Something went wrong. Try again or email us at support@espeezy.com
              </p>
            )}
          </form>
        )}

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '2.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '3.5rem',
          }}
        >
          {[
            { value: '6', label: 'Game modes' },
            { value: '∞', label: 'Questions generated' },
            { value: 'Q3 2026', label: 'Target launch' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, color: '#10b981' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>


      {/* Dynamic categories/games section */}
      <CategoriesGamesSection categories={categories} loading={loading} error={error} />

      {/* CTA */}
      <section
        style={{
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 5vw, 2.5rem)',
          textAlign: 'center',
          borderTop: '1px solid rgba(15, 23, 42, 0.08)',
        }}
      >
        <h2 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.75rem)', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
          Ready to transform how you learn?
        </h2>
        <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
          {GAMES_LANDING_CTA_BODY}
        </p>
        <a
          href="https://espeezy.com"
          style={{
            display: 'inline-block',
            padding: '0.9rem 2.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          Get Early Access →
        </a>

        {/* view features */}
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '3rem auto 0' }}>
          {features.map((feature) => (
            <div key={feature.title} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem', flexShrink: 0 }}>
                ✓
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{feature.title}</div>
                <div style={{ color: '#475569', fontSize: '0.9rem' }}>{feature.description}</div>
              </div>
            </div>
          ))}
        </div>


        
      </section>

      {user && <LiveChatWidget appScope='games' user={user} />}
    </main>
  )
}
