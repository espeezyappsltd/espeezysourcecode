'use client'

import PricingSection from '@/components/PricingSection'
import { Sparkles } from 'lucide-react'

export default function UpgradePage() {
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--p-safe)', display: 'flex', justifyContent: 'center', background: 'linear-gradient(180deg, #0a0c22 0%, #14193a 100%)' }}>
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '4rem', paddingTop: '2rem' }}>
        
        <div style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--brand)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
            <Sparkles size={18} /> THE MISSION IS GROWING
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1, fontWeight: 950, letterSpacing: '-0.04em', color: 'white', margin: 0 }}>
            Support this project to <span style={{ color: 'var(--brand)' }}>reach more schools</span>
          </h1>
          <p style={{ maxWidth: '680px', color: 'rgba(255,255,255,0.8)', fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 }}>
            I am building Espeezy to solve real operational problems for student teams. Your upgrade directly funds infrastructure and new feature development.
          </p>
        </div>

        <PricingSection showTitle={false} />
      </div>
    </div>
  )
}
