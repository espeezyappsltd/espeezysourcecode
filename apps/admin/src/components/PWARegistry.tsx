'use client'

import { useEffect } from 'react'

export default function PWARegistry() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => {
            // Silently handle error in production or use a logging service
          })
      })
    }
  }, [])

  return null
}
