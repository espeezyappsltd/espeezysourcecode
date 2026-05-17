'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { resolveSupabaseEnv } from '@/lib/supabase-env'
import { buildAuthCallbackUrl, resolveClientOrigin } from '@/lib/app-url'
import { LoginAuthGate } from '@shared/LoginAuthGate'
import { sanitizeNextPath, useLoginAuthRedirect } from '@shared/useLoginAuthRedirect'

type AuthMode = 'signin' | 'signup'
// ... rest of styles ...

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: 'system-ui, sans-serif',
  } as CSSProperties,
  cardBase: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
  } as CSSProperties,
  logoWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  } as CSSProperties,
  logoText: {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '-0.03em',
  } as CSSProperties,
  badge: {
    fontSize: '0.6rem',
    fontWeight: 800,
    padding: '2px 7px',
    borderRadius: '4px',
    background: 'linear-gradient(135deg,#6366f1,#f59e0b)',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  } as CSSProperties,
  heading: {
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.03em',
  } as CSSProperties,
  subHeading: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.875rem',
    margin: '0.5rem 0 0',
  } as CSSProperties,
  switchWrap: {
    display: 'flex',
    gap: '0.4rem',
    marginBottom: '1rem',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  } as CSSProperties,
  switchButton: {
    flex: 1,
    padding: '0.6rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#fff',
  } as CSSProperties,
  fieldLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  } as CSSProperties,
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  } as CSSProperties,
  primaryButton: {
    marginTop: '0.5rem',
    padding: '0.85rem',
    borderRadius: '12px',
    border: 'none',
    color: '#fff',
    fontWeight: 800,
    fontSize: '1rem',
    letterSpacing: '-0.01em',
  } as CSSProperties,
  quietText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.8rem',
  } as CSSProperties,
}

function AuthShell({ maxWidth, centered, children }: { maxWidth: string; centered?: boolean; children: ReactNode }) {
  return (
    <div style={styles.page}>
      <div style={{ ...styles.cardBase, maxWidth, ...(centered ? { textAlign: 'center' } : {}) }}>
        {children}
      </div>
    </div>
  )
}

function BrandHeader({ badgeLabel, title, subtitle, iconSize = '2.5rem' }: {
  badgeLabel: string
  title: string
  subtitle?: ReactNode
  iconSize?: string
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <div style={{ fontSize: iconSize, marginBottom: '0.75rem' }}>🎮</div>
      <div style={styles.logoWrap}>
        <span style={styles.logoText}>espeezy</span>
        <span style={styles.badge}>{badgeLabel}</span>
      </div>
      <h1 style={styles.heading}>{title}</h1>
      {subtitle ? <p style={styles.subHeading}>{subtitle}</p> : null}
    </div>
  )
}

function Notice({ children, tone }: { children: ReactNode; tone: 'error' | 'info' }) {
  const palette = tone === 'error'
    ? { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#fca5a5' }
    : { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', text: '#a5b4fc' }

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontSize: '0.875rem',
        marginBottom: '1.25rem',
      }}
    >
      {children}
    </div>
  )
}

function ModeToggle({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  return (
    <div style={styles.switchWrap}>
      <button
        type="button"
        onClick={() => onChange('signin')}
        style={{ ...styles.switchButton, background: mode === 'signin' ? 'rgba(99,102,241,0.2)' : 'transparent' }}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onChange('signup')}
        style={{ ...styles.switchButton, background: mode === 'signup' ? 'rgba(99,102,241,0.2)' : 'transparent' }}
      >
        Create Account
      </button>
    </div>
  )
}

function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label
        style={{
          ...styles.fieldLabel,
          display: 'block',
          marginBottom: '0.4rem',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function UpgradeRequired({ onSignOut }: { onSignOut: () => void }) {
  return (
    <AuthShell maxWidth="460px" centered>
      <BrandHeader badgeLabel="pro" title="Games is a Pro feature" iconSize="3rem" />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
        You&apos;re logged in, but Espeezy Games requires a <strong style={{ color: '#f59e0b' }}>Pro</strong> or <strong style={{ color: '#6366f1' }}>Premium</strong> account. Upgrade to unlock game-based learning, ranked leagues, and co-op challenges.
      </p>
      <a
        href="https://espeezy.com/checkout"
        style={{
          display: 'block',
          padding: '0.85rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg,#6366f1,#f59e0b)',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1rem',
          textDecoration: 'none',
          marginBottom: '1rem',
          letterSpacing: '-0.01em',
        }}
      >
        Upgrade to Pro →
      </a>
      <a
        href="https://kanban.espeezy.com "
        style={{
          display: 'block',
          padding: '0.85rem',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.9rem',
          textDecoration: 'none',
          marginBottom: '1.5rem',
        }}
      >
        Go to Dashboard
      </a>
      <button
        type="button"
        onClick={onSignOut}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', cursor: 'pointer' }}
      >
        Sign out
      </button>
    </AuthShell>
  );
}

function AuthForm({
  mode,
  email,
  setEmail,
  password,
  setPassword,
  legalAccepted,
  setLegalAccepted,
  loading,
  handleSubmit,
  handleReset,
  resetting,
}: {
  mode: AuthMode;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  legalAccepted: boolean;
  setLegalAccepted: (v: boolean) => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  handleReset: (e: React.MouseEvent) => void;
  resetting: boolean;
}) {
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AuthField label="Email">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@university.edu"
          style={styles.input}
        />
      </AuthField>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={styles.fieldLabel}>Password</label>
          {mode === 'signin' && (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              {resetting ? 'Sending…' : 'Forgot password?'}
            </button>
          )}
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          style={styles.input}
        />
      </div>
      {mode === 'signup' && (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', lineHeight: 1.5 }}>
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            style={{ marginTop: '0.1rem' }}
          />
          <span>
            I agree to the <Link href="/terms" style={{ color: '#a5b4fc' }}>Terms</Link> and <Link href="/privacy" style={{ color: '#a5b4fc' }}>Privacy Policy</Link>.
          </span>
        </label>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          ...styles.primaryButton,
          background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#f59e0b)',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : (mode === 'signup' ? 'Create Account' : 'Sign In & Play')}
      </button>
    </form>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNextPath(searchParams.get('next'));
  const { isChecking, isRedirecting, redirectAfterSignIn } = useLoginAuthRedirect(supabase, next);
  const needsUpgrade = searchParams.get('upgrade') === '1';

  const { url: supabaseUrl, anonKey: supabaseKey } = resolveSupabaseEnv();
  const configMissing = !supabaseUrl || !supabaseKey;

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'signup') {
      if (!legalAccepted) {
        setError('Please accept the terms and privacy policy to create your account.');
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            legal_accepted: legalAccepted,
          }
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        redirectAfterSignIn()
        return
      }
      setSuccess('Account created. Check your email to confirm your account, then sign in.');
      setMode('signin');
      setPassword('');
      setLoading(false);
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    redirectAfterSignIn()
  }

  const handleReset = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email first, then click Reset Password.');
      return;
    }
    setResetting(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: buildAuthCallbackUrl(resolveClientOrigin(), { recovery: true }),
    });
    setResetting(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
  };

  if (needsUpgrade) {
    return <UpgradeRequired onSignOut={handleSignOut} />;
  }

  return (
    <LoginAuthGate isChecking={isChecking} isRedirecting={isRedirecting} variant="dark">
    <AuthShell maxWidth="420px">
      <BrandHeader
        badgeLabel="games"
        title={mode === 'signup' ? 'Create your account' : 'Sign in to play'}
        subtitle={<>Requires a <strong style={{ color: '#f59e0b' }}>Pro</strong> Espeezy account.</>}
      />
      <ModeToggle mode={mode} onChange={switchMode} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {configMissing ? (
        <Notice tone="error">
          Authentication is temporarily unavailable. Please try again later or contact support if the issue persists.
        </Notice>
      ) : null}
      {success ? <Notice tone="info">{success}</Notice> : null}
      {resetSent ? <Notice tone="info">Recovery link sent - check your inbox.</Notice> : null}
      <AuthForm
        mode={mode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        legalAccepted={legalAccepted}
        setLegalAccepted={setLegalAccepted}
        loading={loading}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        resetting={resetting}
      />
      <p style={{ ...styles.quietText, marginTop: '1.5rem' }}>
        {mode === 'signup' ? 'Already have an account? ' : 'Need a new account? '}
        <button
          type="button"
          onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
          style={{ background: 'none', border: 'none', color: '#a5b4fc', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
        >
          {mode === 'signup' ? 'Sign in' : 'Create one now'}
        </button>
      </p>
      <p style={{ ...styles.quietText, marginTop: '0.5rem', fontSize: '0.78rem' }}>
        Need Pro to play?{' '}
        <a href="https://espeezy.com/checkout" style={{ color: '#f59e0b', fontWeight: 700 }}>
          Upgrade now →
        </a>
        {' or '}
        <a href="https://espeezy.com/dashboard" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Go to Dashboard
        </a>
      </p>
    </AuthShell>
    </LoginAuthGate>
  );
}