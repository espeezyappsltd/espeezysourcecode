'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'
import { buildAuthCallbackUrl, resolveGamesClientOrigin } from '@/lib/app-url'
import { ESPEEZY_APP_ORIGINS } from '@shared/app-url'
import { SimpleAuthForm } from '@shared/SimpleAuthForm'
import { sanitizeNextPath } from '@shared/app-url'
import { useSimpleAuth } from '@shared/useSimpleAuth'
import { GAMES_UPGRADE_GATE_NOTE } from '@/lib/platform/brand-copy'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const redirectPath = sanitizeNextPath(searchParams.get('next'))
  const recoveryRedirectTo = buildAuthCallbackUrl(resolveGamesClientOrigin(), { recovery: true })
  const defaultMode = searchParams.get('signup') === 'true' ? 'signup' : 'signin'
  const isUpgradeGate = searchParams.get('upgrade') === '1'
  const urlError = searchParams.get('error')

  const canProceedAfterAuth = useCallback(async () => {
    const res = await fetch('/api/auth/access', { credentials: 'include' })
    if (!res.ok) return true
    const data = (await res.json()) as { hasAccess?: boolean }
    if (data.hasAccess === false) {
      if (!isUpgradeGate) {
        router.replace('/login?upgrade=1')
        router.refresh()
      }
      return false
    }
    return true
  }, [router, isUpgradeGate])

  const { ready, busy, error, info, signIn, signUp, resetPassword } = useSimpleAuth(
    supabase,
    redirectPath,
    {
      recoveryRedirectTo,
      skipSessionRedirect: isUpgradeGate,
      canProceedAfterAuth,
    },
  )

  const upgradeBanner = isUpgradeGate ? (
    <div
      style={{
        maxWidth: 400,
        width: '100%',
        margin: '0 auto 1rem',
        padding: '1rem 1.1rem',
        borderRadius: 12,
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        color: '#92400e',
        fontSize: '0.88rem',
        lineHeight: 1.5,
      }}
      role="status"
    >
      <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Pro account required</strong>
      Espeezy Games needs a Pro or Premium plan on your Espeezy account. Free accounts cannot play here.
      <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', color: '#78716c' }}>{GAMES_UPGRADE_GATE_NOTE}</span>
      <a
        href={`${ESPEEZY_APP_ORIGINS.prereg}/pricing`}
        style={{
          display: 'inline-block',
          marginTop: '0.65rem',
          fontWeight: 700,
          color: '#b45309',
        }}
      >
        View plans →
      </a>
    </div>
  ) : null

  return (
    <>
      {upgradeBanner}
      {urlError ? (
        <p
          style={{
            maxWidth: 400,
            margin: '0 auto 1rem',
            padding: '0.75rem',
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: '0.85rem',
          }}
          role="alert"
        >
          {decodeURIComponent(urlError)}
        </p>
      ) : null}
      <SimpleAuthForm
        appName="Espeezy Games"
        tagline="Email and password, same account as Kanban."
        busy={busy}
        ready={ready}
        error={error}
        info={info}
        defaultMode={defaultMode}
        onSignIn={signIn}
        onSignUp={signUp}
        onResetPassword={resetPassword}
      />
    </>
  )
}
