'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Check } from 'lucide-react'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('gf_cookie_consent')
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = (type: 'all' | 'speed') => {
    localStorage.setItem('gf_cookie_consent', type)
    if (type === 'speed') {
      localStorage.setItem('gf_speed_preference', 'fast')
    }
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 5000,
            width: '90%',
            maxWidth: '600px',
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
              <Shield size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, color: '#f3f4f6', fontSize: '1.1rem', fontWeight: 700 }}>We value your privacy</h4>
              <p style={{ margin: '0.25rem 0 0', color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.5 }}>
                We use cookies to improve your experience and keep everything running smoothly. Is that okay?
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              onClick={() => handleAccept('speed')}
              style={{ 
                flex: 1, 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid #222', 
                color: '#f3f4f6', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                fontWeight: 650, 
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Essential Only
            </button>
            <button 
              onClick={() => handleAccept('all')}
              style={{ 
                flex: 1, 
                background: '#10b981', 
                border: 'none', 
                color: '#0a0a0a', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                fontWeight: 800, 
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Check size={14} /> Yes, Accept All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
