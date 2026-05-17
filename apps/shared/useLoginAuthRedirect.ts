'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { sanitizeNextPath } from '@shared/app-url'

export type LoginAuthStatus = 'checking' | 'ready' | 'redirecting'

export { sanitizeNextPath }

/** Max wait before showing the login form (getSession should resolve much sooner). */
const AUTH_READY_FALLBACK_MS = 600

/**
 * Login-page auth probe: getSession first (works after Strict Mode remounts),
 * onAuthStateChange for SIGNED_IN while the form is open, bounded fallback to ready.
 */
export function useLoginAuthRedirect(supabase: SupabaseClient, redirectPath: string) {
  const [status, setStatus] = useState<LoginAuthStatus>('checking')
  const redirectedRef = useRef(false)
  const resolvedRef = useRef(false)
  const redirectPathRef = useRef(redirectPath)
  redirectPathRef.current = redirectPath

  const redirectAfterSignIn = useCallback((path?: string) => {
    if (redirectedRef.current || typeof window === 'undefined') return
    redirectedRef.current = true
    resolvedRef.current = true
    setStatus('redirecting')
    window.location.replace(path ?? redirectPathRef.current)
  }, [])

  const markReady = useCallback(() => {
    if (resolvedRef.current || redirectedRef.current) return
    resolvedRef.current = true
    setStatus('ready')
  }, [])

  const handleSession = useCallback(
    (session: Session | null) => {
      if (resolvedRef.current || redirectedRef.current) return
      if (session) {
        redirectAfterSignIn()
      } else {
        markReady()
      }
    },
    [markReady, redirectAfterSignIn],
  )

  useEffect(() => {
    let active = true
    redirectedRef.current = false
    resolvedRef.current = false
    setStatus('checking')

    const fallbackId = window.setTimeout(() => {
      if (active) markReady()
    }, AUTH_READY_FALLBACK_MS)

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active || resolvedRef.current) return
      window.clearTimeout(fallbackId)
      if (error) {
        markReady()
        return
      }
      handleSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        if (!active || resolvedRef.current || redirectedRef.current) return

        if (event === 'SIGNED_IN' && session) {
          window.clearTimeout(fallbackId)
          redirectAfterSignIn()
          return
        }

        if (event === 'SIGNED_OUT') {
          window.clearTimeout(fallbackId)
          resolvedRef.current = false
          redirectedRef.current = false
          setStatus('ready')
        }
      },
    )

    return () => {
      active = false
      window.clearTimeout(fallbackId)
      subscription.unsubscribe()
    }
  }, [supabase, handleSession, markReady, redirectAfterSignIn])

  return {
    status,
    isChecking: status === 'checking',
    isRedirecting: status === 'redirecting',
    showLoginForm: status === 'ready',
    redirectAfterSignIn,
  }
}
