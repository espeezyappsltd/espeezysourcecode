'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeKanbanNextPath, sanitizeNextPath } from '@shared/app-url'

export type SimpleAuthResult = {
  ok: boolean
  needsEmailConfirm?: boolean
  message?: string
}

export function useSimpleAuth(
  supabase: SupabaseClient | null,
  redirectPath: string,
  options?: {
    /** Use Kanban path rules (maps /sso and /dashboard to workspace `/`). Default false. */
    kanbanPaths?: boolean
    recoveryRedirectTo?: string
    oauthRedirectTo?: string
    /** When true, keep the login form visible even if a session already exists. */
    skipSessionRedirect?: boolean
    /** Return false to stay on login (e.g. tier upgrade gate). */
    canProceedAfterAuth?: () => Promise<boolean>
  },
) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const checkedRef = useRef(false)
  const normalizePath = options?.kanbanPaths ? sanitizeKanbanNextPath : sanitizeNextPath
  const pathRef = useRef(normalizePath(redirectPath))
  pathRef.current = normalizePath(redirectPath)

  const goAfterAuth = useCallback(async () => {
    if (options?.canProceedAfterAuth) {
      const allowed = await options.canProceedAfterAuth()
      if (!allowed) return
    }
    const path = pathRef.current
    router.replace(path)
    router.refresh()
  }, [router, options])

  useEffect(() => {
    if (!supabase || checkedRef.current) {
      if (!supabase) setReady(true)
      return
    }
    checkedRef.current = true
    let cancelled = false

    const finish = () => {
      if (!cancelled) setReady(true)
    }

    const timer = window.setTimeout(finish, 400)

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      window.clearTimeout(timer)
      if (session && !options?.skipSessionRedirect) {
        void goAfterAuth()
        return
      }
      finish()
    })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [supabase, goAfterAuth, options?.skipSessionRedirect])

  const signIn = useCallback(
    async (email: string, password: string): Promise<SimpleAuthResult> => {
      if (!supabase) {
        setError('Sign-in is not configured. Check Supabase environment variables.')
        return { ok: false }
      }
      setBusy(true)
      setError(null)
      setInfo(null)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      setBusy(false)
      if (signInError) {
        setError(signInError.message)
        return { ok: false, message: signInError.message }
      }
      goAfterAuth()
      return { ok: true }
    },
    [supabase, goAfterAuth],
  )

  const signUp = useCallback(
    async (email: string, password: string): Promise<SimpleAuthResult> => {
      if (!supabase) {
        setError('Sign-up is not configured. Check Supabase environment variables.')
        return { ok: false }
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return { ok: false }
      }
      setBusy(true)
      setError(null)
      setInfo(null)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      setBusy(false)
      if (signUpError) {
        setError(signUpError.message)
        return { ok: false, message: signUpError.message }
      }
      if (data.session) {
        goAfterAuth()
        return { ok: true }
      }
      const msg = 'Account created. Check your email to confirm, then sign in.'
      setInfo(msg)
      return { ok: true, needsEmailConfirm: true, message: msg }
    },
    [supabase, goAfterAuth],
  )

  const resetPassword = useCallback(
    async (email: string): Promise<SimpleAuthResult> => {
      if (!supabase) {
        setError('Password reset is not configured.')
        return { ok: false }
      }
      const trimmed = email.trim()
      if (!trimmed) {
        setError('Enter your email address first.')
        return { ok: false }
      }
      if (!options?.recoveryRedirectTo) {
        setError('Password reset is not available.')
        return { ok: false }
      }
      setBusy(true)
      setError(null)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: options.recoveryRedirectTo,
      })
      setBusy(false)
      if (resetError) {
        setError(resetError.message)
        return { ok: false, message: resetError.message }
      }
      const msg = `Password reset link sent to ${trimmed}`
      setInfo(msg)
      return { ok: true, message: msg }
    },
    [supabase, options?.recoveryRedirectTo],
  )

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github'): Promise<SimpleAuthResult> => {
      if (!supabase) {
        setError('OAuth sign-in is not configured. Check Supabase environment variables.')
        return { ok: false }
      }
      if (!options?.oauthRedirectTo) {
        setError('OAuth callback URL is not configured.')
        return { ok: false }
      }
      setBusy(true)
      setError(null)
      setInfo(null)

      const callback = new URL(options.oauthRedirectTo)
      callback.searchParams.set('next', pathRef.current)

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      })
      setBusy(false)
      if (oauthError) {
        setError(oauthError.message)
        return { ok: false, message: oauthError.message }
      }
      return { ok: true }
    },
    [supabase, options?.oauthRedirectTo],
  )

  return {
    ready,
    busy,
    error,
    info,
    setError,
    setInfo,
    signIn,
    signUp,
    resetPassword,
    signInWithOAuth,
  }
}
