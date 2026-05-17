'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type SearchParamsLike = { get: (key: string) => string | null } | null

/**
 * Establishes a Supabase recovery session from callback code, hash tokens, or existing session.
 */
export function useRecoverySession(
  supabase: SupabaseClient,
  searchParams: SearchParamsLike,
) {
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const establishRecoverySession = async () => {
      const code = searchParams?.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!mounted) return
        if (exchangeError) {
          setError(exchangeError.message)
          return
        }
        setSessionReady(true)
        return
      }

      if (typeof window !== 'undefined') {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!mounted) return
          if (sessionError) {
            setError(sessionError.message)
            return
          }
          window.history.replaceState({}, document.title, window.location.pathname)
          setSessionReady(true)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session) {
        setSessionReady(true)
        return
      }

      setError('Recovery session not found. Please request a new password reset link.')
    }

    void establishRecoverySession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
        setError(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [searchParams, supabase])

  return { sessionReady, error, setError }
}
