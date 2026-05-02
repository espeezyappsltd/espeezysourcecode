'use client'

import React from 'react'
import Link from 'next/link'
import { Zap, Globe, Lock, Shield, ArrowRight, Activity } from 'lucide-react'

export default function SyncPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f3f4f6' }}>
      
      <nav style={{ 
        height: '64px', borderBottom: '1px solid #222', 
        display: 'flex', alignItems: 'center', gap: '2rem',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)'
      }}>
        <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>← Back</Link>
        <span style={{ fontWeight: 700 }}>Real-time Synchronicity</span>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '8rem 2rem' }}>
        <section style={{ marginBottom: '10rem', textAlign: 'center' }}>
          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>Global Networking</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '2.5rem' }}>
            Zero-latency <br /> 
            <span style={{ color: '#10b981' }}>collaborative state.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: '800px', margin: '0 auto 4rem' }}>
            Espeezy&apos;s sync engine utilizes a peer-to-peer relay protocol to ensure that every team action—from a chat message 
            to a presence update—is propagated across your whole team in milliseconds.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/login?signup=true" style={{ background: '#10b981', color: '#0a0a0a', padding: '1rem 2.5rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 900 }}>Get Started</Link>
            <Link href="/docs/infra/sync" style={{ color: '#f3f4f6', border: '1px solid #222', padding: '1rem 2.5rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>Technical Manual</Link>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
           <div style={{ padding: '3rem', background: 'linear-gradient(180deg, #111 0%, #0d0d0d 100%)', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Globe size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Global Relay</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Our infrastructure is distributed globally to provide high-speed synchronization for academic teams working 
                across different time zones and countries.
              </p>
           </div>
           <div style={{ padding: '3rem', background: 'linear-gradient(180deg, #111 0%, #0d0d0d 100%)', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Lock size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Data Integrity</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Every synchronized packet is verified for integrity, ensuring that concurrent edits never lead to data loss or 
                desynchronized states.
              </p>
           </div>
           <div style={{ padding: '3rem', background: 'linear-gradient(180deg, #111 0%, #0d0d0d 100%)', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Activity size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Performance Metrics</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Monitor your team&apos;s real-time velocity through automated analytics that track collaboration frequency and 
                update patterns.
              </p>
           </div>
        </div>
      </main>
    </div>
  )
}
