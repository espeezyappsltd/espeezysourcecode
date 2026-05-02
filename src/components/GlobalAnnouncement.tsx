'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Shield, Activity, Globe } from 'lucide-react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'

interface AnnouncementConfig {
  key: string
  is_active: boolean
  value: {
    title: string
    message: string
    style: 'elite' | 'alert'
  }
}

export default function GlobalAnnouncement() {
  const [config, setConfig] = useState<AnnouncementConfig | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  // Use a ref to prevent React StrictMode double-subscription errors:
  // StrictMode mounts→unmounts→mounts in dev; the cleanup removes the channel
  // before the second mount, so using a unique channel name per effect avoids
  // "cannot add postgres_changes callbacks after subscribe()" errors.
  const mountIdRef = useRef(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    mountIdRef.current += 1
    const mountId = mountIdRef.current

    const db = createBrowserSupabaseClient()

    // 1. Initial Fetch
    const fetchConfig = async () => {
      const { data } = await db
        .from('platform_config')
        .select('*')
        .eq('key', 'global_announcement')
        .single()
      
      if (data) setConfig(data)
    }
    fetchConfig()

    setIsClient(true)
  }, [])

  if (!isClient || !isVisible || !config?.is_active) return null

  const { title, message, style } = config.value || { title: 'Institutional Update', message: '', style: 'elite' }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 100000,
          maxWidth: '400px',
          width: 'calc(100% - 4rem)',
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(32px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '1.5rem',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Elite Ambient Glow */}
        <div style={{ 
          position: 'absolute', 
          top: '-50%', 
          right: '-50%', 
          width: '100%', 
          height: '100%', 
          background: style === 'elite' ? 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none' 
        }} />

        <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '14px', 
            background: style === 'elite' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(236, 72, 153, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: style === 'elite' ? '#10b981' : '#ec4899',
            flexShrink: 0
          }}>
            {style === 'elite' ? <Shield size={24} /> : <AlertCircle size={24} />}
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 950, color: 'white', letterSpacing: '-0.02em' }}>{title}</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{message}</p>
          </div>

          <button 
            onClick={() => setIsVisible(false)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              width: '28px', 
              height: '28px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.3)',
              transition: '0.2s'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.3 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Activity size={10} /> ORCHESTRA_UPLINK</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Globe size={10} /> BROADCAST_LIVE</div>
        </div>

        <style jsx>{`
          div:hover button { color: white; opacity: 1; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  )
}
