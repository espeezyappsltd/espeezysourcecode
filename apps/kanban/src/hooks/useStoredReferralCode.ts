'use client'

import { useEffect, useState } from 'react'
import { isValidReferralCode, normalizeReferralCode } from '@shared/referrals'

const STORAGE_KEY = 'espeezy_ref_code'

export function useStoredReferralCode(): string | null {
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('ref')
    if (fromUrl && isValidReferralCode(fromUrl)) {
      const normalized = normalizeReferralCode(fromUrl)
      localStorage.setItem(STORAGE_KEY, normalized)
      setCode(normalized)
      return
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    setCode(stored && isValidReferralCode(stored) ? normalizeReferralCode(stored) : null)
  }, [])

  return code
}

export function clearStoredReferralCode(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}
