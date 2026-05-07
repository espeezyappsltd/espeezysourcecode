'use client'

import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'

const FEATURES = [
  {
    icon: '📋',
    title: 'Academic Kanban Boards',
    description:
      'Drag-and-drop boards built for coursework. Organize tasks by subject, deadline priority, or custom workflow — exactly how your brain works.',
  },
  {
    icon: '👥',
    title: 'Group Project Management',
    description:
      'Assign tasks to teammates, track individual contributions, and surface blockers before they become problems. No more "who\'s doing what?"',
  },
  {
    icon: '📈',
    title: 'Contribution Analytics',
    description:
      'See exactly how much each team member has contributed with burndown charts, activity heatmaps, and weekly velocity reports.',
  },
  {
    icon: '🔔',
    title: 'Smart Deadline Alerts',
    description:
      'AI-powered deadline predictions based on your workload. Get nudged when a task is at risk before it\'s too late to recover.',
  },
  {
    icon: '🔗',
    title: 'Espeezy Integration',
    description:
      'Kanban cards link directly to your Espeezy notes, documents, and peer sessions. Everything lives in one connected workspace.',
  },
  {
    icon: '📱',
    title: 'Mobile & Offline First',
    description:
      'Full-featured mobile app with offline sync. Update your board from the library, on the bus, or anywhere without a signal.',
  },
]

// Mini kanban preview — purely decorative
const BOARD_PREVIEW = [
  {
    col: 'To Do',
    color: '#475569',
    cards: ['Literature review', 'Write abstract', 'Format citations'],
  },
  {
    col: 'In Progress',
    color: '#6366f1',
    cards: ['Data analysis', 'Methodology draft'],
  },
  {
    col: 'Done',
    color: '#10b981',
    cards: ['Project setup', 'Research brief', 'Team kickoff'],
  },
]

export default function KanbanPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      if (nextUser) {
        setAuthError('')
        setLoginStatus('idle')
      }
    })
    return () => unsub()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginEmail.trim() || !loginPassword) return
    setLoginStatus('loading')
    setAuthError('')

    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword)
      setLoginStatus('idle')
      setLoginPassword('')
    } catch {
      setLoginStatus('error')
      setAuthError('Login failed. Use the email/password from your Espeezy account.')
    }
  }

  async function handleLogout() {
    await signOut(auth).catch(() => undefined)
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('https://espeezy.com/api/preregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'kanban-waitlist' }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
      {/* Skip link */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: '-100%',
          left: '0.5rem',
          zIndex: 99999,
          padding: '0.5rem 1rem',
          background: '#6366f1',
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

      {/* Nav */}
      <nav
        aria-label="Main navigation"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 clamp(1rem, 4vw, 2.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
        }}
      >
        <a
          href="https://espeezy.com/preregister"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          aria-label="Back to Espeezy"
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>
            espeezy
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg,#6366f1,#10b981)',
              color: '#fff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            kanban
          </span>
        </a>
        <a
          href="https://espeezy.com/preregister"
          style={{
            fontSize: '0.85rem',
            color: '#94a3b8',
            textDecoration: 'none',
            padding: '0.4rem 1rem',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          }}
        >
          ← Early Access
        </a>
      </nav>

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
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '0.9rem 1rem',
          }}
        >
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
                Logged in as <strong style={{ color: '#fff' }}>{user.email}</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <a
                  href="https://espeezy.com/login"
                  style={{ color: '#a7f3d0', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  Open Main App
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: '#fff',
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
            <form onSubmit={handleLogin} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginRight: '0.25rem' }}>
                Log in with your Espeezy account
              </span>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                placeholder="Email"
                style={{
                  flex: '1 1 180px',
                  minWidth: 0,
                  padding: '0.6rem 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                }}
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                placeholder="Password"
                style={{
                  flex: '1 1 160px',
                  minWidth: 0,
                  padding: '0.6rem 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                }}
              />
              <button
                type="submit"
                disabled={loginStatus === 'loading'}
                style={{
                  padding: '0.6rem 0.9rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg,#6366f1,#10b981)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: loginStatus === 'loading' ? 'wait' : 'pointer',
                }}
              >
                {loginStatus === 'loading' ? 'Logging in…' : 'Log In'}
              </button>
              {authError && (
                <p role="alert" style={{ margin: 0, width: '100%', color: '#fca5a5', fontSize: '0.8rem' }}>
                  {authError}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Hero */}
      <section
        id="main-content"
        style={{
          padding: 'clamp(5rem, 12vw, 9rem) clamp(1rem, 5vw, 2.5rem) clamp(4rem, 8vw, 6rem)',
          textAlign: 'center',
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)',
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
            background: 'rgba(16,185,129,0.1)',
            padding: '0.3rem 0.9rem',
            borderRadius: '20px',
            border: '1px solid rgba(16,185,129,0.25)',
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
            background: 'linear-gradient(135deg, #fff 0%, #a7f3d0 40%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Your coursework,<br />finally organised.
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: '#94a3b8',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            lineHeight: 1.7,
          }}
        >
          Visual boards, smart deadlines, group task tracking, and contribution analytics — 
          built for the way students and academic teams actually work.
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
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              color: '#10b981',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            <span aria-hidden="true">✓</span> You&apos;re on the list! We&apos;ll notify you at launch.
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
            <label htmlFor="kanban-email" className="sr-only">Email address</label>
            <input
              id="kanban-email"
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
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: '#f8fafc',
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
                background: 'linear-gradient(135deg,#6366f1,#10b981)',
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
              <p role="alert" style={{ width: '100%', textAlign: 'center', color: '#ef4444', fontSize: '0.85rem' }}>
                Something went wrong. Try again or email us at hello@espeezy.com
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
            { value: '∞', label: 'Boards & cards' },
            { value: 'Real-time', label: 'Collaboration' },
            { value: 'Q3 2026', label: 'Target launch' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, color: '#10b981' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Board preview */}
      <section
        aria-label="Kanban board preview"
        style={{
          padding: '0 clamp(1rem, 5vw, 2.5rem) clamp(3rem, 6vw, 5rem)',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            overflowX: 'auto',
          }}
        >
          {BOARD_PREVIEW.map(({ col, color, cards }) => (
            <div key={col} style={{ minWidth: '180px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {col}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {cards.map((card) => (
                  <div
                    key={card}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.8rem',
                      color: '#e2e8f0',
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569', marginTop: '0.75rem' }}>
          Interactive preview — coming Q3 2026
        </p>
      </section>

      {/* Features grid */}
      <section
        aria-labelledby="features-heading"
        style={{
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 5vw, 2.5rem)',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <h2
          id="features-heading"
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#fff',
          }}
        >
          What to expect
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {FEATURES.map(({ icon, title, description }) => (
            <article
              key={title}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1.75rem',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(16,185,129,0.4)'
                el.style.background = 'rgba(16,185,129,0.06)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.background = 'rgba(255,255,255,0.04)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }} aria-hidden="true">{icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>{title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 5vw, 2.5rem)',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.75rem)', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
          Stop losing track of what matters.
        </h2>
        <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Join the Espeezy early-access list and be first to try Kanban when it launches.
        </p>
        <a
          href="https://espeezy.com/preregister"
          style={{
            display: 'inline-block',
            padding: '0.9rem 2.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg,#6366f1,#10b981)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          Get Early Access →
        </a>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '2rem clamp(1rem, 4vw, 2.5rem)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <p style={{ fontSize: '0.8rem', color: '#475569' }}>
          © 2026 Espeezy. All rights reserved.
        </p>
        <nav aria-label="Footer links" style={{ display: 'flex', gap: '1.5rem' }}>
          {[
            { href: 'https://espeezy.com/preregister', label: 'Early Access' },
            { href: 'https://games.espeezy.com', label: 'Games' },
            { href: 'https://espeezy.com/preregister/privacy', label: 'Privacy' },
            { href: 'https://espeezy.com/preregister/terms', label: 'Terms' },
          ].map(({ href, label }) => (
            <a
              key={label}
              href={href}
              style={{ fontSize: '0.8rem', color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#475569' }}
            >
              {label}
            </a>
          ))}
        </nav>
      </footer>
    </main>
  )
}
