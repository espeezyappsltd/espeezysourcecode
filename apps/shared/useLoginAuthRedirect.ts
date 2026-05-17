'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js'

export type LoginAuthStatus = 'checking' | 'ready' | 'redirecting'

const AUTH_CHECK_TIMEOUT_MS = 3000

/** Reject open-redirect paths; allow only same-origin relative routes. */
export function sanitizeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes(':')) {
    return fallback
  }
  return next
}

/**
 * Stable login-page session probe: one listener, one redirect, bounded wait.
 * Uses Supabase INITIAL_SESSION / SIGNED_IN instead of racing getSession + navigation.
 */
export function useLoginAuthRedirect(supabase: SupabaseClient, redirectPath: string) {
  const [status, setStatus] = useState<LoginAuthStatus>('checking')
  const redirectedRef = useRef(false)
  const redirectPathRef = useRef(redirectPath)
  redirectPathRef.current = redirectPath

  const redirectAfterSignIn = useCallback((path?: string) => {
    if (redirectedRef.current || typeof window === 'undefined') return
    redirectedRef.current = true
    setStatus('redirecting')
    window.location.replace(path ?? redirectPathRef.current)
  }, [])

  useEffect(() => {
    let active = true
    redirectedRef.current = false
    setStatus('checking')

    const markReady = () => {
      if (active && !redirectedRef.current) setStatus('ready')
    }

    const timeoutId = window.setTimeout(markReady, AUTH_CHECK_TIMEOUT_MS)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        if (!active || redirectedRef.current) return

        if (event === 'INITIAL_SESSION') {
          window.clearTimeout(timeoutId)
          if (session) {
            redirectAfterSignIn()
          } else {
            markReady()
          }
          return
        }

        if (event === 'SIGNED_IN' && session) {
          window.clearTimeout(timeoutId)
          redirectAfterSignIn()
          return
        }

        if (event === 'SIGNED_OUT') {
          markReady()
        }
      },
    )

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase, redirectAfterSignIn])

  return {
    status,
    isChecking: status === 'checking',
    isRedirecting: status === 'redirecting',
    showLoginForm: status === 'ready',
    redirectAfterSignIn,
  }
}
