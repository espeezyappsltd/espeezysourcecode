'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { buildAuthCallbackUrl, resolveClientOrigin } from '@/lib/app-url'
import { SimpleAuthForm } from '@shared/SimpleAuthForm'
import { sanitizeNextPath } from '@shared/app-url'
import { useSimpleAuth } from '@shared/useSimpleAuth'
import { resolveLoginRedirectPath } from '@/lib/pricing/plan-routes'

function LoginContent() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createSupabaseClient(), [])
  const redirectPath = sanitizeNextPath(
    resolveLoginRedirectPath(
      searchParams?.get('next') ?? searchParams?.get('redirect'),
      searchParams?.get('plan'),
    ),
  )
  const recoveryRedirectTo = buildAuthCallbackUrl(resolveClientOrigin(), { recovery: true })
  const wantsSignup =
    searchParams?.get('signup') === 'true' ||
    (searchParams?.get('plan') != null && searchParams.get('plan') !== 'free')
  const defaultMode = wantsSignup ? 'signup' : 'signin'

  const { ready, busy, error, info, signIn, signUp, resetPassword } = useSimpleAuth(
    supabase,
    redirectPath,
    { recoveryRedirectTo },
  )

  return (
    <SimpleAuthForm
      appName="Espeezy Kanban"
      tagline="Sign in with your email and password."
      busy={busy}
      ready={ready}
      error={error}
      info={info}
      defaultMode={defaultMode}
      onSignIn={signIn}
      onSignUp={signUp}
      onResetPassword={resetPassword}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f4f6f8',
            color: '#64748b',
          }}
        >
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
