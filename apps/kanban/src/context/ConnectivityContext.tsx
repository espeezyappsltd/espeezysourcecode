'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ConnectivityContextType {
  isOnline: boolean
  effectiveType: string | null
  isSlow: boolean
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  effectiveType: null,
  isSlow: false
})

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [effectiveType, setEffectiveType] = useState<string | null>(null)
  
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const updateConnection = () => {
      // @ts-expect-error - navigator.connection is not in all typings
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (conn) {
        setEffectiveType(conn.effectiveType)
      }
    }

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    
    // @ts-expect-error - navigator.connection is not in all typings
    const conn = navigator.connection
    if (conn) {
      conn.addEventListener('change', updateConnection)
      updateConnection()
    }

    updateStatus()

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      if (conn) {
        conn.removeEventListener('change', updateConnection)
      }
    }
  }, [])

  const isSlow = effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g'

  return (
    <ConnectivityContext.Provider value={{ isOnline, effectiveType, isSlow }}>
      {children}
    </ConnectivityContext.Provider>
  )
}

export const useConnectivity = () => useContext(ConnectivityContext)
