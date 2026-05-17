'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useSupabaseUser } from './useSupabaseUser'
import { fetchPreregisterCount, submitPreregister } from '@/services/preregister'

export type WaitlistStatus = 'idle' | 'loading' | 'done' | 'error'

export function useGamesLanding() {
  const user = useSupabaseUser()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<WaitlistStatus>('idle')
  const [registeredCount, setRegisteredCount] = useState<number | null>(null)

  // Fetch registration count
  useEffect(() => {
    let active = true

    const refresh = async () => {
      try {
        const count = await fetchPreregisterCount()
        if (active) {
          setRegisteredCount(typeof count === 'number' ? count : null)
        }
      } catch {
        if (active) {
          setRegisteredCount(null)
        }
      }
    }

    void refresh()

    const interval = setInterval(() => {
      void refresh()
    }, 30_000)

    const onFocus = () => {
      void refresh()
    }

    window.addEventListener('focus', onFocus)

    return () => {
      active = false
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  async function handleLogout() {
    const supabase = getSupabaseClient()
    if (supabase) await supabase.auth.signOut().catch(() => undefined)
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const result = await submitPreregister({
        email: email.trim(),
        source: 'games-waitlist',
      })
      if (result.ok) {
        setStatus('done')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return {
    email,
    handleLogout,
    handleNotify,
    registeredCount,
    setEmail,
    status,
    user,
  }
}
