'use client'

import { useEffect } from 'react'
import { useConnectivity } from '@/context/ConnectivityContext'

/**
 * Automagically manages the '.toaster-mode' class on the body tag
 * based on network conditions and performance preferences.
 */
export default function ToasterModeManager() {
  const { isSlow } = useConnectivity()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateToasterMode = () => {
      // Logic for automatic "Toaster Mode"
      // 1. Slow connection (2G/3G)
      // 2. Reduced motion preference
      // 3. User manual override (from localStorage)
      
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const isManualToaster = localStorage.getItem('gf_toaster_mode') === 'true'
      
      if (isSlow || isReducedMotion || isManualToaster) {
        document.body.classList.add('toaster-mode')
      } else {
        document.body.classList.remove('toaster-mode')
      }
    }

    updateToasterMode()

    // Monitor for manual changes to storage
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gf_toaster_mode') updateToasterMode()
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [isSlow])

  return null // No UI, just logic
}
