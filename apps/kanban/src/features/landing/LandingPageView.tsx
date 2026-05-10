'use client'

import type { User } from '@supabase/supabase-js'
import PreregFooter from '@/components/PreregFooter'
import { BOARD_PREVIEW, FEATURES } from './content'
import type { WaitlistStatus } from './useLandingPage'

type LandingPageViewProps = {
  email: string
  fullName: string
  institution: string
  onLogout: () => Promise<void>
  onNotify: (event: React.FormEvent<HTMLFormElement>) => void
  registeredCount: number | null
  role: string
  setEmail: (value: string) => void
  setFullName: (value: string) => void
  setInstitution: (value: string) => void
  setRole: (value: string) => void
  setWaitlistPassword: (value: string) => void
  status: WaitlistStatus
  user: User | null
  waitlistPassword: string
}

function SkipLink() {
  return (
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
      onFocus={(event) => {
        event.currentTarget.style.top = '0'
      }}
      onBlur={(event) => {
        event.currentTarget.style.top = '-100%'
      }}
    >
      Skip to content
    </a>
  )
}

function LandingNav() {
  return (
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
        href="https://espeezy.com"
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
            background: 'linear-gradient(135deg,#059669,#10b981)',
            color: '#fff',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          kanban
        </span>
      </a>
      <a
        href="https://espeezy.com"
        style={{
          fontSize: '0.85rem',
          color: '#94a3b8',
          textDecoration: 'none',
          padding: '0.4rem 1rem',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.color = '#fff'
          event.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.color = '#94a3b8'
          event.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        }}
      >
        ← Early Access
      </a>
    </nav>
  )
}

function AccountAccessSection({
  onLogout,
  user,
}: Pick<LandingPageViewProps, 'onLogout' | 'user'>) {
  return (
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
                href="/mvp"
                style={{ color: '#a7f3d0', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}
              >
                Open Kanban MVP
              </a>
              <button
                type="button"
                onClick={onLogout}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              Sign in once to open your Kanban workspace and keep your cross-app session.
            </p>
            <a
              href="https://espeezy.com/login"
              style={{
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'transparent',
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: '0.8rem',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Sign In
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

function HeroSection({
  email,
  fullName,
  institution,
  onNotify,
  registeredCount,
  role,
  setEmail,
  setFullName,
  setInstitution,
  setRole,
  setWaitlistPassword,
  status,
  waitlistPassword,
}: Pick<LandingPageViewProps, 'email' | 'fullName' | 'institution' | 'onNotify' | 'registeredCount' | 'role' | 'setEmail' | 'setFullName' | 'setInstitution' | 'setRole' | 'setWaitlistPassword' | 'status' | 'waitlistPassword'>) {
  return (
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
          background: 'linear-gradient(135deg, #fff 0%, #a7f3d0 40%, #059669 100%)',
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
        Visual boards, smart deadlines, group task tracking, and contribution analytics.
        {' '}
        built for the way students and academic teams actually work.
      </p>

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
          <span aria-hidden="true">🙂</span> You are in the list 🙂
        </div>
      ) : (
        <form
          onSubmit={onNotify}
          style={{
            display: 'flex',
            gap: '0.75rem',
            maxWidth: '640px',
            margin: '0 auto',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <label htmlFor="kanban-full-name" className="sr-only">Full name</label>
          <input
            id="kanban-full-name"
            type="text"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value)
            }}
            placeholder="Full name (optional)"
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
          <label htmlFor="kanban-email" className="sr-only">Email address</label>
          <input
            id="kanban-email"
            type="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
            }}
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
          <label htmlFor="kanban-password" className="sr-only">Create password</label>
          <input
            id="kanban-password"
            type="password"
            required
            minLength={8}
            value={waitlistPassword}
            onChange={(event) => {
              setWaitlistPassword(event.target.value)
            }}
            placeholder="Create password (8+ chars)"
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
          <label htmlFor="kanban-institution" className="sr-only">Institution</label>
          <input
            id="kanban-institution"
            type="text"
            value={institution}
            onChange={(event) => {
              setInstitution(event.target.value)
            }}
            placeholder="Institution (optional)"
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
          <label htmlFor="kanban-role" className="sr-only">Role</label>
          <select
            id="kanban-role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value)
            }}
            disabled={status === 'loading'}
            style={{
              flex: '1 1 220px',
              minWidth: 0,
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: '#1f2937',
              color: '#f8fafc',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          >
            <option value="student">Student</option>
            <option value="educator">Educator</option>
            <option value="researcher">Researcher</option>
          </select>
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg,#059669,#10b981)',
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
          <p style={{ width: '100%', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            This also creates your Espeezy login for cross-app access.
          </p>
          {status === 'error' && (
            <p role="alert" style={{ width: '100%', textAlign: 'center', color: '#ef4444', fontSize: '0.85rem' }}>
              Something went wrong. Try again or email us at hello@espeezy.com
            </p>
          )}
        </form>
      )}

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
          {
            value: registeredCount === null ? '...' : new Intl.NumberFormat('en-US').format(registeredCount),
            label: 'Registered users',
          },
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
  )
}

function BoardPreviewSection() {
  return (
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
        {BOARD_PREVIEW.map(({ cards, color, column }) => (
          <div key={column} style={{ minWidth: '180px' }}>
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
                {column}
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
        Interactive preview - coming Q3 2026
      </p>
    </section>
  )
}

function FeaturesSection() {
  return (
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
        {FEATURES.map(({ description, icon, title }) => (
          <article
            key={title}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '1.75rem',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={(event) => {
              const card = event.currentTarget
              card.style.borderColor = 'rgba(16,185,129,0.4)'
              card.style.background = 'rgba(16,185,129,0.06)'
            }}
            onMouseLeave={(event) => {
              const card = event.currentTarget
              card.style.borderColor = 'rgba(255,255,255,0.08)'
              card.style.background = 'rgba(255,255,255,0.04)'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }} aria-hidden="true">{icon}</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function CtaSection() {
  return (
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
          background: 'linear-gradient(135deg,#059669,#10b981)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
          textDecoration: 'none',
        }}
      >
        Get Early Access →
      </a>
    </section>
  )
}

export function LandingPageView(props: LandingPageViewProps) {
  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
      <SkipLink />
      <LandingNav />
      <AccountAccessSection
        onLogout={props.onLogout}
        user={props.user}
      />
      <HeroSection
        email={props.email}
        fullName={props.fullName}
        institution={props.institution}
        onNotify={props.onNotify}
        registeredCount={props.registeredCount}
        role={props.role}
        setEmail={props.setEmail}
        setFullName={props.setFullName}
        setInstitution={props.setInstitution}
        setRole={props.setRole}
        setWaitlistPassword={props.setWaitlistPassword}
        status={props.status}
        waitlistPassword={props.waitlistPassword}
      />
      <BoardPreviewSection />
      <FeaturesSection />
      <CtaSection />
      <PreregFooter />
    </main>
  )
}
