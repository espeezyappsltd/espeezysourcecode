'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'
import { buildAuthCallbackUrl, resolveGamesClientOrigin } from '@/lib/app-url'
import { SimpleAuthForm } from '@shared/SimpleAuthForm'
import { sanitizeNextPath } from '@shared/app-url'
import { useSimpleAuth } from '@shared/useSimpleAuth'

export default function LoginClient() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const redirectPath = sanitizeNextPath(searchParams.get('next'))
  const recoveryRedirectTo = buildAuthCallbackUrl(resolveGamesClientOrigin(), { recovery: true })
  const defaultMode = searchParams.get('signup') === 'true' ? 'signup' : 'signin'

  const { ready, busy, error, info, signIn, signUp, resetPassword } = useSimpleAuth(
    supabase,
    redirectPath,
    { recoveryRedirectTo },
  )

  return (
    <SimpleAuthForm
      appName="Espeezy Games"
      tagline="Email and password — same account as Kanban."
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
