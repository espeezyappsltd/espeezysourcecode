'use client'

import { useState, useEffect } from 'react'
import { X, Zap } from 'lucide-react'
import { db, firestoreClientEnabled } from '@/lib/firebase'
import { doc, onSnapshot, DocumentData } from 'firebase/firestore'

export default function PromoBanner() {
  const [isClient] = useState(() => typeof window !== 'undefined')
  const [config, setConfig] = useState<DocumentData | null>(null)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof localStorage === 'undefined') return true
    return !localStorage.getItem('gf_promo_dismissed_v2')
  })

  useEffect(() => {
    if (!firestoreClientEnabled) return
    if (!isClient) return;

    const unsub = onSnapshot(doc(db, 'platform_config', 'main_banner'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data())
      }
    })

    return () => unsub()
  }, [isClient])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('gf_promo_dismissed_v2', 'true')
  }

  const configValue = typeof config?.value === 'object' && config.value !== null ? config.value as Record<string, string> : {}
  if (!isClient || !isVisible || !config?.is_active) return null

  const bannerText = configValue.text || '30% OFF ALL CLEARANCE TIERS'
  const promoCode = configValue.code || 'ELITE30'

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
        {bannerText} — CODE: <span style={{
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
