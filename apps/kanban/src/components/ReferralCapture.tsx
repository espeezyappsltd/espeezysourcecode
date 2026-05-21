'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import { useStoredReferralCode } from '@/hooks/useStoredReferralCode'

/** Persists ?ref= from URL and links referrer on the signed-in profile once. */
export default function ReferralCapture() {
  const referralCode = useStoredReferralCode()
  const attachedRef = useRef(false)
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  useEffect(() => {
    if (!referralCode || attachedRef.current) return

    let cancelled = false

    void (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token || cancelled) return

      attachedRef.current = true
      await fetch('/api/referral/attach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ referral_code: referralCode }),
      }).catch(() => {
        attachedRef.current = false
      })
    })()

    return () => {
      cancelled = true
    }
  }, [referralCode, supabase])

  return null
}
