'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { buildAuthCallbackUrl, ESPEEZY_APP_ORIGINS, resolveClientOrigin, sanitizeNextPath } from '@shared/app-url'
import { useLoginAuthRedirect } from '@shared/useLoginAuthRedirect'
import { supabase } from '@/lib/supabase-client'
import StudiosLogo from '@/components/StudiosLogo'

function LoginFormContent() {
  const searchParams = useSearchParams()
  const next = sanitizeNextPath(searchParams?.get('next'))
  const initialError = searchParams?.get('error') ?? ''
  const [oauthBusy, setOauthBusy] = useState(false)
  const [emailBusy, setEmailBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(initialError)

  const { isChecking, isRedirecting } = useLoginAuthRedirect(supabase, next)

  useEffect(() => {
    setError(initialError)
  }, [initialError])

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthBusy(true)
    setError('')
    setMessage('')
    try {
      const callbackUrl = new URL(
        buildAuthCallbackUrl(resolveClientOrigin(ESPEEZY_APP_ORIGINS.studios)),
      )
      callbackUrl.searchParams.set('next', next)
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl.toString() },
      })
      if (oauthError) {
        setError(oauthError.message)
        setOauthBusy(false)
      }
    } catch {
      setError('Unable to start sign-in. Please try again.')
      setOauthBusy(false)
    }
  }

  async function handleEmailSignIn() {
    setEmailBusy(true)
    setError('')
    setMessage('')
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your email address.')
      setEmailBusy(false)
      return
    }

    try {
      const callbackUrl = new URL(
        buildAuthCallbackUrl(resolveClientOrigin(ESPEEZY_APP_ORIGINS.studios)),
      )
      callbackUrl.searchParams.set('next', next)
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: callbackUrl.toString() },
      })
      if (emailError) {
        setError(emailError.message)
      } else {
        setMessage('Magic link sent. Check your inbox to continue.')
      }
    } catch {
      setError('Unable to start email sign-in. Please try again.')
    } finally {
      setEmailBusy(false)
    }
  }

  if (isChecking || isRedirecting) {
    return (
      <main id="main-content" className="studio-auth-page">
        <p className="studio-auth-card__desc">Signing you in…</p>
      </main>
    )
  }

  return (
    <main id="main-content" className="studio-auth-page">
      <div className="studio-auth-card">
        <StudiosLogo variant="login" className="studio-auth-card__logo" />
        <h1 className="studio-auth-card__title">Sign in to Studio</h1>
        <p className="studio-auth-card__desc">Access your dashboard, jobs, and client delivery tools.</p>
        {error ? (
          <p className="studio-auth-card__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="studio-auth-card__actions">
          <button
            type="button"
            className="studio-auth-btn studio-auth-btn--github"
            disabled={oauthBusy || emailBusy}
            onClick={() => void handleOAuth('github')}
          >
            {oauthBusy ? 'Redirecting…' : 'Continue with GitHub'}
          </button>
          <button
            type="button"
            className="studio-auth-btn studio-auth-btn--google"
            disabled={oauthBusy || emailBusy}
            onClick={() => void handleOAuth('google')}
          >
            {oauthBusy ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </div>
        <div className="studio-auth-card__divider">or</div>
        <label className="studio-auth-card__field">
          <span>Email address</span>
          <input
            type="email"
            value={email}
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="studio-auth-btn studio-auth-btn--email"
          disabled={emailBusy || oauthBusy}
          onClick={() => void handleEmailSignIn()}
        >
          {emailBusy ? 'Sending link…' : 'Send magic link'}
        </button>
        {message ? <p className="studio-auth-card__success">{message}</p> : null}
      </div>
    </main>
  )
}

export default function StudioLoginForm() {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="studio-auth-page">
          <p className="studio-auth-card__desc">Loading…</p>
        </main>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
