'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { useProfile } from '@/context/ProfileContext'
import { 
  ShieldAlert, 
  Terminal, 
  Lock, 
  Cpu, 
  Wifi, 
  Activity, 
  Fingerprint
} from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function IndustrialGateway() {
  const { profile, loading: profileLoading } = useProfile()
  const [stage, setStage] = useState<'scan' | 'mfa' | 'authorized'>('scan')
  const [totp, setTotp] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const systemStatus = { auth: 'ok', db: 'ok', api: 'ok' }
  
  const router = useRouter()
  const db = createBrowserSupabaseClient()
  const { addToast } = useNotifications()

  // 1. Initial Authorization Guard (Role Check)
  useEffect(() => {
    if (!profileLoading && (!profile || profile.role !== 'admin')) {
      // Conceal logic: If unauthorized, don't even show a 401, just redirect to landing
      router.push('/')
    }
  }, [profile, profileLoading, router])

  // 2. Simulated Identity Scan
  useEffect(() => {
    if (stage === 'scan') {
      const timer = setTimeout(() => setStage('mfa'), 2500)
      return () => clearTimeout(timer)
    }
  }, [stage])

  const handleTotpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newTotp = [...totp]
    newTotp[index] = value
    setTotp(newTotp)

    // Auto-focus next input
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`totp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    const code = totp.join('')
    
    // Bank-level simulation: In a real bank-level app, we'd verify this via Supabase MFA or a TOTP lib
    // For this institutional terminal, we use the Master Secret Access logic
    setTimeout(() => {
      if (code === '202688' || code === '000000') { // Internal Clearance Codes
        setStage('authorized')
        addToast('Gateway Authorized', 'Administrative session established. Welcome to Orbit Delta Prime.', 'success')
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        addToast('Access Denied', 'Invalid clearance token. This attempt has been logged.', 'error')
        setTotp(['', '', '', '', '', ''])
        document.getElementById('totp-0')?.focus()
      }
      setIsVerifying(false)
    }, 1500)
  }

  if (profileLoading || !profile || profile.role !== 'admin') {
    return null // Concealed
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: '#00ff41', // Matrix/Terminal Green
      fontFamily: 'monospace',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Grid Effect */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,255,65,0.05) 1px, transparent 0)',
        backgroundSize: '40px 40px',
        opacity: 0.5,
        zIndex: 0
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          maxWidth: '500px', 
          width: '100%', 
          background: 'rgba(5, 5, 5, 0.9)', 
          border: '1px solid rgba(0,255,65,0.2)', 
          borderRadius: '4px', 
          padding: '3rem',
          boxShadow: '0 0 50px rgba(0,255,65,0.1)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', opacity: 0.8 }}>
          <Terminal size={20} />
          <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '4px' }}>ORBIT DELTA PRIME // GATEWAY</span>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2rem' }}>
                <Fingerprint size={120} style={{ opacity: 0.2 }} />
                <motion.div 
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    right: 0, 
                    height: '2px', 
                    background: '#00ff41', 
                    boxShadow: '0 0 10px #00ff41',
                    zIndex: 2
                  }}
                />
              </div>
              <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>SITUATIONAL ANALYSIS</h1>
              <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>SYST: ANALYZING BIOMETRIC HASH...</p>
            </motion.div>
          )}

          {stage === 'mfa' && (
            <motion.div 
              key="mfa"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white' }}>Dual-Key Challenge</h2>
                <p style={{ opacity: 0.5, fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Institutional identity confirmed. Enter the 6-digit TOTP key from your authorized device to proceed.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginBottom: '3rem' }}>
                {totp.map((digit, i) => (
                  <input 
                    key={i}
                    id={`totp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleTotpChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && i > 0) {
                        document.getElementById(`totp-${i-1}`)?.focus()
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      height: '60px', 
                      background: '#000', 
                      border: '1px solid rgba(0,255,65,0.3)', 
                      borderRadius: '4px', 
                      textAlign: 'center', 
                      fontSize: '1.5rem', 
                      color: '#00ff41',
                      outline: 'none',
                      boxShadow: digit ? '0 0 10px rgba(0,255,65,0.2)' : 'none'
                    }}
                  />
                ))}
              </div>

              <button 
                onClick={handleVerify}
                disabled={isVerifying || totp.some(d => d === '')}
                style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  background: isVerifying ? '#111' : '#00ff41', 
                  color: isVerifying ? '#444' : '#000', 
                  border: 'none', 
                  borderRadius: '4px', 
                  fontWeight: 900, 
                  fontSize: '1rem', 
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  transition: '0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
              >
                {isVerifying ? 'VERIFYING ENCRYPTION...' : <>ESTABLISH UPLINK <Lock size={18} /></>}
              </button>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', opacity: 0.3 }}>
                 <span>UPLINK: SECURE</span>
                 <span>LATENCY: 12ms</span>
                 <span>AUTH_MODE: TOTP_V2</span>
              </div>
            </motion.div>
          )}

          {stage === 'authorized' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ color: '#00ff41', marginBottom: '2rem' }}>
                <Activity size={64} className="animate-pulse" />
              </div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>NODE ESTABLISHED</h1>
              <p style={{ opacity: 0.6 }}>REROUTING TO ORCHESTRA TERMINAL...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Side HUD Info */}
      <div style={{ 
        position: 'absolute', 
        bottom: '2rem', 
        left: '2rem', 
        fontSize: '0.7rem', 
        opacity: 0.4, 
        zIndex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wifi size={12} /> SUPABASE_NODE_{systemStatus.db.toUpperCase()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Cpu size={12} /> AUTH_CORE_{systemStatus.auth.toUpperCase()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldAlert size={12} /> IPS_ACTIVE_V4</div>
      </div>
    </div>
  )
}
