"use client"

import { useMemo, useState, useEffect } from 'react'
import { auth as firebaseAuth } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth'
import TransientError from '@/components/TransientError'
import { PrivacyPolicy, TermsOfService, CookiePolicy } from '@/components/Legal/Policies'
import { BookOpen, User, Lock, ExternalLink, Activity } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import { Phone, Hash as HashIcon } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [authTab, setAuthTab] = useState<'email' | 'phone'>(searchParams.get('method') === 'phone' ? 'phone' : 'email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(error)
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true')
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'cookies' | null>(null)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [loading, setLoading] = useState(false)

  // Client-side guard: Bounce authenticated users back to dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        router.replace('/dashboard')
      } else {
        setCheckingAuth(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null)

    try {
      if (isSignUp) {
        if (!legalAccepted) throw new Error('Please accept the legal policies.')
        await createUserWithEmailAndPassword(firebaseAuth, email, password)
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password)
      }
      router.push('/dashboard')
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError("Please enter your email address first.")
      return
    }
    setIsResetting(true)
    setAuthError(null)
    try {
      await sendPasswordResetEmail(firebaseAuth, email)
      setResetMessage("Secure recovery link sent to " + email)
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setIsResetting(false)
    }
  }

  // Real-time password strength evaluation
  const passwordStrength = useMemo(() => {
    if (!password) return null;
    let score = 0;
    if (password.length > 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: '#ef4444' };
    if (score === 2) return { label: 'Fair', color: '#f59e0b' };
    if (score === 3) return { label: 'Strong', color: '#10b981' };
    return { label: 'Secure', color: '#06b6d4' };
  }, [password]);

  const handleGithubLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    const db = createBrowserSupabaseClient();
    await db.auth.signInWithOAuth({ provider: 'github' });
  };

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    const db = createBrowserSupabaseClient();
    await db.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleRequestOtp = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!phone.startsWith('+')) {
      setAuthError('Please include the country code (e.g. +1 for USA)')
      return
    }
    setSendingOtp(true)
    setAuthError(null)
    const db = createBrowserSupabaseClient()
    const { error } = await db.auth.signInWithOtp({ phone })
    if (error) setAuthError(error.message)
    else setOtpSent(true)
    setSendingOtp(false)
  }

  const handleVerifyOtp = async (e: React.MouseEvent) => {
    e.preventDefault()
    setSendingOtp(true)
    setAuthError(null)
    const db = createBrowserSupabaseClient()
    const { error } = await db.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) setAuthError(error.message)
    else router.replace('/dashboard')
    setSendingOtp(false)
  }

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      position: 'relative',
      padding: '1rem',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(30px)',
          borderRadius: '40px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '3.5rem',
          position: 'relative',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--brand, #10b981) 0%, #6366f1 100%)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 12px 24px rgba(16,185,129,0.25)' }}>
            <BookOpen color="white" size={32} />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em', margin: 0 }}>
            {isSignUp ? 'Join Espeezy' : 'Secure Login'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem', fontWeight: 600, fontSize: '1rem' }}>
            {isSignUp ? "Connect with your project team." : "Enter your terminal credentials."}
          </p>
        </div>

        {(error || authError || resetMessage) && (
          <TransientError message={error || authError || resetMessage || ''} type={resetMessage ? 'success' : 'error'} />
        )}

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isSignUp && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button 
                type="button" 
                onClick={() => setAuthTab('email')}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', background: authTab === 'email' ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >Email</button>
              <button 
                type="button" 
                onClick={() => setAuthTab('phone')}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', background: authTab === 'phone' ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >Phone</button>
            </div>
          )}

          {authTab === 'email' || isSignUp ? (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authentication Identity</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                  <input
                    className="form-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '16px', fontSize: '1rem' }}
                    placeholder="scholar@university.edu"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Access Secret</span>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      style={{ background: 'none', border: 'none', color: 'var(--brand, #10b981)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      disabled={isResetting}
                    >
                      {isResetting ? 'Processing...' : 'Recovery link'}
                    </button>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                  <input
                    className="form-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '16px', fontSize: '1rem' }}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Identity</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                  <input
                    className="form-input"
                    type="tel"
                    required
                    disabled={otpSent}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '16px' }}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>

              {otpSent && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Authorization Code</span>
                    <button type="button" onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', cursor: 'pointer' }}>Retry identity</button>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <HashIcon size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                    <input
                      className="form-input"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '16px' }}
                      placeholder="6-digit code"
                    />
                  </div>
                </div>
              )}

              {otpSent ? (
                <button type="button" className="btn btn-primary" onClick={handleVerifyOtp} disabled={sendingOtp || otp.length < 6} style={{ height: '3.5rem', borderRadius: '18px', fontWeight: 950 }}>
                  {sendingOtp ? 'Verifying...' : 'Authorize Terminal'}
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={handleRequestOtp} disabled={sendingOtp || phone.length < 8} style={{ height: '3.5rem', borderRadius: '18px', fontWeight: 950 }}>
                  {sendingOtp ? 'Processing...' : 'Request Code'}
                </button>
              )}
            </>
          )}

          {isSignUp && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="legal"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                required
              />
              <label htmlFor="legal" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                I accept the <button type="button" onClick={() => setActivePolicy('terms')} style={{ background: 'none', border: 'none', color: 'var(--brand, #10b981)', padding: 0, cursor: 'pointer', fontWeight: 700 }}>Terms</button>,
                <button type="button" onClick={() => setActivePolicy('privacy')} style={{ background: 'none', border: 'none', color: 'var(--brand, #10b981)', padding: 0, cursor: 'pointer', fontWeight: 700 }}>Privacy</button>, and
                <button type="button" onClick={() => setActivePolicy('cookies')} style={{ background: 'none', border: 'none', color: 'var(--brand, #10b981)', padding: 0, cursor: 'pointer', fontWeight: 700 }}>Cookies</button>.
              </label>
            </div>
          )}

          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(authTab === 'email' || isSignUp) && (
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ height: '3.5rem', borderRadius: '18px', fontWeight: 950, fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--brand, #10b981) 0%, #059669 100%)', border: 'none' }}>
                {loading ? (isSignUp ? 'Initializing Identity...' : 'Authorizing...') : (isSignUp ? 'Create Scholar Account' : 'Sign In')}
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800 }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>

        {!isSignUp && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Peer OAuth</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button onClick={handleGoogleLogin} style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.56 2.68-3.86 2.68-6.62z" fill="#4285F4"/><path d="M9 18c2.43 0 4.46-.8 5.95-2.18l-2.92-2.26c-.8.54-1.84.86-3.03.86-2.33 0-4.3-1.57-5-3.68H.98V13.1A8.99 8.99 0 0 0 9 18z" fill="#34A853"/><path d="M4 10.74A5.4 5.4 0 0 1 3.72 9c0-.6.1-1.18.28-1.74V5H.98A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.98 4.1L4 10.74z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.46 3.43 1.36l2.57-2.58C13.45.9 11.43 0 9 0A8.99 8.99 0 0 0 .98 5L4 7.26C4.7 5.15 6.67 3.58 9 3.58z" fill="#EA4335"/></svg>
                Google
              </button>
              <button onClick={handleGithubLogin} style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <ExternalLink size={18} color="rgba(255,255,255,0.4)" />
                GitHub
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            <Activity size={14} color="var(--brand, #10b981)" /> 
            Scholar Protocol Secured
          </div>
        </div>
      </div>

      {/* Policy Modals */}
      {activePolicy === 'privacy' && <PrivacyPolicy onClose={() => setActivePolicy(null)} />}
      {activePolicy === 'terms' && <TermsOfService onClose={() => setActivePolicy(null)} />}
      {activePolicy === 'cookies' && <CookiePolicy onClose={() => setActivePolicy(null)} />}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div className="spinner" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
