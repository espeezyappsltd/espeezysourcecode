'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, LogOut, CheckCircle2 } from 'lucide-react'
import ModalOverlay from './ModalOverlay'

const IDLE_TIMEOUT = 1000 * 60 * 4; // 4 minutes of inactivity
const COUNTDOWN_DURATION = 60; // 60 seconds warning

export default function SessionGuard() {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Monitor Authentication State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user)
      if (!user) {
        setShowWarning(false)
        router.refresh()
      }
    })

    return () => unsub()
  }, [router])

  const handleLogout = useCallback(async () => {
    await signOut(auth)
    setShowWarning(false)
    router.push('/login')
    router.refresh()
  }, [router])

  const resetTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    
    if (isAuthenticated) {
      idleTimerRef.current = setTimeout(() => {
        setShowWarning(true)
        setCountdown(COUNTDOWN_DURATION)
      }, IDLE_TIMEOUT)
    }
  }, [isAuthenticated])

  // 2. Event Listeners for Activity
  useEffect(() => {
    if (!isAuthenticated || pathname === '/login' || pathname === '/') {
       if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
       queueMicrotask(() => setShowWarning(false))
       return
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    let lastActivityTime = Date.now()
    
    const handleActivity = () => {
      const now = Date.now()
      // Throttle density: Only reset timers if at least 1 second has passed since last activity reset
      if (!showWarning && now - lastActivityTime > 1000) {
        lastActivityTime = now
        resetTimers()
      }
    }

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }))
    resetTimers()

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [isAuthenticated, pathname, showWarning, resetTimers])

  // 3. Countdown Logic when Warning is visible
  useEffect(() => {
    if (showWarning && countdown > 0) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      queueMicrotask(() => void handleLogout())
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [showWarning, countdown, handleLogout])

  const stayLoggedIn = () => {
    setShowWarning(false)
    resetTimers()
  }

  if (!showWarning) return null

  return (
    <ModalOverlay maxWidth="480px">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ padding: '2.5rem', textAlign: 'center' }}
      >
        <div style={{ 
          width: '72px', 
          height: '72px', 
          borderRadius: '50%', 
          background: 'rgba(217, 119, 6, 0.1)', 
          color: '#d97706', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 20px rgba(217, 119, 6, 0.2)'
        }}>
          <Clock size={36} className="animate-pulse" />
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Are you still working?
        </h3>
        
        <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Your session will be securely terminated in <span style={{ color: 'var(--brand)', fontWeight: 800 }}>{countdown} seconds</span> due to inactivity.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={stayLoggedIn}
            style={{ 
              width: '100%', 
              padding: '1.25rem', 
              borderRadius: '16px', 
              background: 'var(--brand)', 
              color: '#0a0a0a', 
              fontWeight: 950, 
              fontSize: '1rem', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 10px 25px rgba(var(--brand-rgb), 0.3)'
            }}
          >
            <CheckCircle2 size={18} /> I&apos;m Still Here
          </button>
          
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '1.25rem', 
              borderRadius: '16px', 
              background: 'rgba(255,255,255,0.03)', 
              color: '#ef4444', 
              fontWeight: 800, 
              fontSize: '0.9rem', 
              border: '1px solid rgba(239, 68, 68, 0.1)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={16} /> Sign Out Now
          </button>
        </div>
      </motion.div>
    </ModalOverlay>
  )
}
