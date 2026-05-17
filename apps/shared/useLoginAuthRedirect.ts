'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { isEmbedPreview, sanitizeNextPath } from '@shared/app-url'

export type LoginAuthStatus = 'checking' | 'ready' | 'redirecting'

export { sanitizeNextPath }

/** Max wait before showing the login form (getSession should resolve much sooner). */
const AUTH_READY_FALLBACK_MS = 600
const GET_USER_TIMEOUT_MS = 10_000

/**
 * Login-page auth probe: getSession first, confirm with getUser before redirect,
 * onAuthStateChange for SIGNED_IN, bounded fallback to ready. Uses client navigation
 * in embed preview to avoid iframe reload loops with middleware.
 */
export function useLoginAuthRedirect(supabase: SupabaseClient | null, redirectPath: string) {
  const router = useRouter()
  const [status, setStatus] = useState<LoginAuthStatus>('checking')
  const redirectedRef = useRef(false)
  const resolvedRef = useRef(false)
  const redirectPathRef = useRef(redirectPath)
  redirectPathRef.current = redirectPath

  const navigateAfterSignIn = useCallback(
    (path: string) => {
      if (typeof window === 'undefined') return
      const embed =
        isEmbedPreview(new URLSearchParams(window.location.search)) || window.self !== window.top
      if (embed) {
        router.replace(path)
        router.refresh()
        return
      }
      window.location.replace(path)
    },
    [router],
  )

  const releaseToLoginForm = useCallback(() => {
    redirectedRef.current = false
    resolvedRef.current = false
    setStatus('ready')
  }, [])

  const redirectAfterSignIn = useCallback(
    async (path?: string) => {
      if (redirectedRef.current || typeof window === 'undefined' || !supabase) return

      let user = null
      let error: Error | null = null
      try {
        const result = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error('getUser timeout')), GET_USER_TIMEOUT_MS)
          }),
        ])
        user = result.data.user
        error = result.error
      } catch {
        await supabase.auth.signOut().catch(() => undefined)
        releaseToLoginForm()
        return
      }

      if (error || !user) {
        await supabase.auth.signOut().catch(() => undefined)
        releaseToLoginForm()
        return
      }

      redirectedRef.current = true
      resolvedRef.current = true
      setStatus('redirecting')
      navigateAfterSignIn(path ?? redirectPathRef.current)
    },
    [navigateAfterSignIn, releaseToLoginForm, supabase],
  )

  const markReady = useCallback(() => {
    if (resolvedRef.current || redirectedRef.current) return
    resolvedRef.current = true
    setStatus('ready')
  }, [])

  const handleSession = useCallback(
    (session: Session | null) => {
      if (resolvedRef.current || redirectedRef.current) return
      const embed =
        typeof window !== 'undefined' &&
        (isEmbedPreview(new URLSearchParams(window.location.search)) || window.self !== window.top)
      if (embed) {
        markReady()
        return
      }
      if (session) {
        void redirectAfterSignIn()
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

    if (!supabase) {
      markReady()
      return () => {
        active = false
      }
    }

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      if (!active || resolvedRef.current || redirectedRef.current) return

      if (event === 'SIGNED_IN' && session) {
        window.clearTimeout(fallbackId)
        const embed =
          typeof window !== 'undefined' &&
          (isEmbedPreview(new URLSearchParams(window.location.search)) || window.self !== window.top)
        if (!embed) void redirectAfterSignIn()
        else markReady()
        return
      }

      if (event === 'SIGNED_OUT') {
        window.clearTimeout(fallbackId)
        resolvedRef.current = false
        redirectedRef.current = false
        setStatus('ready')
      }
    })

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
