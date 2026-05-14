'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { Check, X, Info, AlertTriangle, Loader2, ShieldCheck, Lock, WifiOff } from 'lucide-react'
import { useConnectivity } from '@/context/ConnectivityContext'

interface LoadingState {
  isLoading: boolean
  progress: number
  message: string
}

interface ConfirmationState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel?: () => void
  type: 'success' | 'info' | 'warning'
}

interface GlobalLoadingContextType {
  startLoading: (message: string) => void
  finishLoading: () => void
  showConfirmation: (config: Omit<ConfirmationState, 'isOpen'>) => void
  withLoading: <T>(task: () => Promise<T>, message: string) => Promise<T>
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined)

export const useSmartLoading = () => {
  const context = useContext(GlobalLoadingContext)
  if (!context) throw new Error('useSmartLoading must be used within GlobalLoadingProvider')
  return context
}

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, progress: 0, message: '' })
  const [confirm, setConfirm] = useState<ConfirmationState>({ 
    isOpen: false, title: '', message: '', type: 'info', onConfirm: () => {} 
  })
  
  const { isOnline, isSlow } = useConnectivity()
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const appearanceTimeout = useRef<NodeJS.Timeout | null>(null)

  const startLoading = useCallback((message: string) => {
    // Clear any existing timeouts or intervals
    if (appearanceTimeout.current) clearTimeout(appearanceTimeout.current)
    if (progressInterval.current) clearInterval(progressInterval.current)

    // Wait 250ms before showing the loader to prevent flashes for fast tasks
    appearanceTimeout.current = setTimeout(() => {
      setLoading({ isLoading: true, progress: 0, message })

      progressInterval.current = setInterval(() => {
        setLoading(prev => {
          if (!prev.isLoading) return prev
          
          let next = prev.progress
          if (next < 40) next += Math.random() * 15 // Rapid start
          else if (next < 85) next += Math.random() * 2 // Steady crawl
          else if (next < 98) next += 0.1 // Precision hold
          
          return { ...prev, progress: Math.min(next, 98) }
        })
      }, 150)
    }, 250)
  }, [])

  const finishLoading = useCallback(() => {
    if (appearanceTimeout.current) clearTimeout(appearanceTimeout.current)
    if (progressInterval.current) clearInterval(progressInterval.current)
    
    // Snap to 100% and close
    setLoading(prev => {
      if (!prev.isLoading) return { isLoading: false, progress: 0, message: '' }
      return { ...prev, progress: 100 }
    })

    // Reduce delay for a more responsive exit
    setTimeout(() => {
      setLoading({ isLoading: false, progress: 0, message: '' })
    }, 200)
  }, [])

  const withLoading = useCallback(async <T,>(task: () => Promise<T>, message: string): Promise<T> => {
    startLoading(message)
    try {
      const result = await task()
      return result
    } finally {
      finishLoading()
    }
  }, [startLoading, finishLoading])

  const showConfirmation = useCallback((config: Omit<ConfirmationState, 'isOpen'>) => {
    setConfirm({ ...config, isOpen: true })
  }, [])

  return (
    <GlobalLoadingContext.Provider value={{ startLoading, finishLoading, showConfirmation, withLoading }}>
      {children}
      
      {/* Smart Central Loader Overlay */}
      {loading.isLoading && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(var(--bg-rgb), 0.7)', backdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }} className="vault-sync-hex">
              {/* Vault Shield Metaphor */}
              <div style={{ 
                position: 'absolute', inset: 0, borderRadius: '24px', 
                border: '4px solid var(--border)', borderTopColor: 'var(--brand)',
                transform: 'rotate(45deg)',
                animation: 'spin 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite'
              }} />
              {/* Progress Text */}
              <div style={{ 
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.05em'
              }}>
                {Math.round(loading.progress)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--text-main)', marginBottom: '0.4rem', letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Lock size={18} className="text-brand" />
                {loading.message}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                {isSlow ? 'Low Bandwidth Optimization Active' : 'Establishing Encrypted Node...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Barrier */}
      {!isOnline && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(60px)',
          animation: 'fadeIn 0.5s ease-out', padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'var(--error)' }}>
              <WifiOff size={40} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 950, color: 'white', marginBottom: '1rem', letterSpacing: '-0.04em' }}>Vault Locked</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: '2rem', lineHeight: 1.6 }}>Your connection has been interrupted. Access is paused to ensure data integrity.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--brand)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <span className="pulse-pill" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
              Monitoring Recovery...
            </div>
          </div>
        </div>
      )}

      {/* Global Feedback Popup */}
      {confirm.isOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          padding: '2rem', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ 
            background: 'var(--surface)', borderRadius: '28px', border: '1px solid var(--border)', 
            padding: '2.5rem', maxWidth: '440px', width: '100%', textAlign: 'center',
            boxShadow: 'var(--shadow-xl)', animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '22px', margin: '0 auto 1.5rem',
              background: confirm.type === 'success' ? 'rgba(30, 142, 62, 0.1)' : 'rgba(var(--brand-rgb), 0.1)',
              color: confirm.type === 'success' ? 'var(--success)' : 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {confirm.type === 'success' ? <Check size={32} /> : <Info size={32} />}
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>{confirm.title}</h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2rem', lineHeight: 1.5, fontWeight: 600 }}>{confirm.message}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {confirm.onCancel && (
                <button 
                  onClick={() => { setConfirm(prev => ({ ...prev, isOpen: false })); confirm.onCancel?.(); }}
                  className="btn btn-secondary" style={{ flex: 1 }}
                >Cancel</button>
              )}
              <button 
                onClick={() => { setConfirm(prev => ({ ...prev, isOpen: false })); confirm.onConfirm(); }}
                className="btn btn-primary" style={{ flex: 1 }}
              >OK</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </GlobalLoadingContext.Provider>
  )
}
