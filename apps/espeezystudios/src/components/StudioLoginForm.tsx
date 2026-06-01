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
  const [error, setError] = useState(initialError)

  const { isChecking, isRedirecting } = useLoginAuthRedirect(supabase, next)

  useEffect(() => {
    setError(initialError)
  }, [initialError])

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthBusy(true)
    setError('')
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
            disabled={oauthBusy}
            onClick={() => void handleOAuth('github')}
          >
            {oauthBusy ? 'Redirecting…' : 'Continue with GitHub'}
          </button>
          <button
            type="button"
            className="studio-auth-btn studio-auth-btn--google"
            disabled={oauthBusy}
            onClick={() => void handleOAuth('google')}
          >
            {oauthBusy ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </div>
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
