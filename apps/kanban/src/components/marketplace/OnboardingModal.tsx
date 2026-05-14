'use client'

import React from 'react'
import { CheckCircle2, Handshake } from 'lucide-react'

interface OnboardingModalProps {
  onClose: () => void
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="page-fade" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        background: 'var(--surface)', 
        borderRadius: '32px', 
        overflow: 'hidden', 
        position: 'relative',
        boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ height: '8px', background: 'var(--brand)' }} />
        <div style={{ padding: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(var(--brand-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', marginBottom: '1.5rem' }}>
            <Handshake size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '1rem' }}>Welcome to the Exchange</h2>
          <p style={{ color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1rem' }}>
            Espeezy&apos;s internal marketplace is designed for students to share hardware, textbooks, and resources securely. 
            Coordinate swaps at academic safe-zones and process payments via Stripe or Cash.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flexShrink: 0 }}><CheckCircle2 className="text-success" size={20} /></div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Verify your resource before handoff.</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flexShrink: 0 }}><CheckCircle2 className="text-success" size={20} /></div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Always meet in academic safe-zones.</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <div style={{ flexShrink: 0 }}><CheckCircle2 className="text-success" size={20} /></div>
               <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Report prohibited or fraudulent behavior.</div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '2.5rem', padding: '1rem', borderRadius: '16px', fontWeight: 900, fontSize: '1rem' }}
          >
            Let&apos;s Begin
          </button>
        </div>
      </div>
    </div>
  )
}
