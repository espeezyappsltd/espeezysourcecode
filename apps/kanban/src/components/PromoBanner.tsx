'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Zap } from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'

interface PlatformConfig {
  id: string
  config_key: string
  config_value: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function PromoBanner() {
  const [isClient] = useState(() => typeof window !== 'undefined')
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof localStorage === 'undefined') return true
    return !localStorage.getItem('gf_promo_dismissed_v2')
  })
  const db = useMemo(() => createBrowserSupabaseClient(), [])

  useEffect(() => {
    if (!isClient) return

    // Initial fetch
    db.from('platform_config')
      .select('*')
      .eq('config_key', 'main_banner')
      .single()
      .then(({ data, error }: { data: PlatformConfig | null; error: unknown }) => {
        if (error) {
          console.warn('Failed to load promo banner config:', error)
          return
        }
        if (data) {
          setConfig(data as PlatformConfig)
        }
      })

    // Real-time subscription
    const channel = db
      .channel('platform_config_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_config',
          filter: `config_key=eq.main_banner`
        },
        (payload: any) => {
          if (payload.new && typeof payload.new === 'object') {
            setConfig(payload.new as PlatformConfig)
          }
        }
      )
      .subscribe()

    return () => {
      db.removeChannel(channel)
    }
  }, [isClient, db])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('gf_promo_dismissed_v2', 'true')
  }

  // Extract config values from Supabase JSON column
  const configValue = typeof config?.config_value === 'object' && config?.config_value !== null ? config.config_value as Record<string, string> : {}
  if (!isClient || !isVisible || !config?.is_active) return null

  const bannerText = (configValue.text as string) || '30% OFF ALL CLEARANCE TIERS'
  const promoCode = (configValue.code as string) || 'ELITE30'

  return (
    <div className="promo-banner-container" style={{
      position: 'relative',
      zIndex: 20000,
      background: 'linear-gradient(90deg, #10b981 0%, #6366f1 33%, #ec4899 66%, #10b981 100%)',
      backgroundSize: '300% auto',
      animation: 'gradientFlow 8s linear infinite',
      color: 'white',
      padding: '0.6rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2.5rem',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div className="promo-shimmer" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 950, fontSize: '0.8rem', letterSpacing: '0.1em', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
        <Zap size={18} fill="white" className="animate-pulse" />
        <span style={{ textTransform: 'uppercase' }}>Current Target </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.95rem',
        fontWeight: 850,
        color: 'white',
        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        {bannerText}  -  CODE: <span style={{
          background: 'rgba(255,255,255,1)',
          padding: '4px 12px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          color: 'black',
          border: '2px solid rgba(255,255,255,0.5)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          fontWeight: 950,
          scale: '1.05'
        }}>{promoCode}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            opacity: 0.6,
            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="dismiss-btn"
        >
          <X size={18} />
        </button>
      </div>

      <style jsx>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        .promo-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg) translateX(-150%);
          animation: intenseShimmer 4s infinite;
        }
        @keyframes intenseShimmer {
          0% { transform: skewX(-20deg) translateX(-150%); }
          50% { transform: skewX(-20deg) translateX(250%); }
          100% { transform: skewX(-20deg) translateX(250%); }
        }
        .dismiss-btn:hover {
          opacity: 1;
          transform: rotate(90deg);
        }
        @media (max-width: 900px) {
          .promo-banner-container { gap: 1rem; flex-direction: column; text-align: center; padding: 1rem; }
        }
      `}</style>
    </div>
  )
}
