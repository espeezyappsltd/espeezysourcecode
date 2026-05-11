'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import { fetchPreregisterCount, submitPreregister } from '@/services/preregister'

export type WaitlistStatus = 'idle' | 'loading' | 'done' | 'error'

export function useLandingPage() {
  const user = useSupabaseUser()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [waitlistPassword, setWaitlistPassword] = useState('')
  const [institution, setInstitution] = useState('')
  const [role, setRole] = useState('student')
  const [status, setStatus] = useState<WaitlistStatus>('idle')
  const [registeredCount, setRegisteredCount] = useState<number | null>(null)

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
    await supabase.auth.signOut().catch(() => undefined)
  }

  async function handleNotify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || waitlistPassword.trim().length < 8) {
      return
    }

    setStatus('loading')

    try {
      const result = await submitPreregister({
        email: email.trim(),
        password: waitlistPassword.trim(),
        fullName: fullName.trim() || undefined,
        institution: institution.trim() || undefined,
        role: role.trim() || undefined,
        source: 'kanban-waitlist',
      })

      if (typeof result.count === 'number') {
        setRegisteredCount(result.count)
      }

      if (result.ok) {
        setWaitlistPassword('')
      }

      setStatus(result.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return {
    email,
    fullName,
    handleLogout,
    handleNotify,
    institution,
    registeredCount,
    role,
    setEmail,
    setFullName,
    setInstitution,
    setRole,
    setWaitlistPassword,
    status,
    user,
    waitlistPassword,
  }
}
