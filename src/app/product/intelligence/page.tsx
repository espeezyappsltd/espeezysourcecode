'use client'

import React from 'react'
import Link from 'next/link'
import { LayoutGrid, Layers, Activity, Zap, ArrowRight, Shield } from 'lucide-react'

export default function IntelligencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f3f4f6' }}>
      
      {/* Search Header */}
      <nav style={{ 
        height: '64px', borderBottom: '1px solid #222', 
        display: 'flex', alignItems: 'center', gap: '2rem',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)'
      }}>
        <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>← Back</Link>
        <span style={{ fontWeight: 700 }}>Project Intelligence</span>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '8rem 2rem' }}>
        <section style={{ marginBottom: '10rem' }}>
          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>Core Infrastructure</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '2.5rem' }}>
            Synchronized workflow <br /> 
            <span style={{ color: '#10b981' }}>management protocol.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: '800px', marginBottom: '4rem' }}>
            The Kanban Project Intelligence engine is the heart of Espeezy. It transform static task lists into a living, 
            breathing representation of your contribution history with real-time state persistence.
          </p>
          <Link href="/login?signup=true" style={{ 
            background: '#10b981', color: '#0a0a0a', padding: '1rem 2.5rem', 
            borderRadius: '12px', textDecoration: 'none', fontWeight: 900,
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem'
          }}>
            Initialize Kanban <ArrowRight size={20} />
          </Link>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
           <div style={{ padding: '3rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Layers size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>State Persistence</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Unlike standard boards, our technical Kanban syncs every drag-and-drop event instantly to the team database 
                using our high-performance relay system.
              </p>
           </div>
           <div style={{ padding: '3rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Shield size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Verified Logging</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Every transition across intervals is cryptographically logged to the user profile, creating an immutable history of 
                verified work contributions.
              </p>
           </div>
           <div style={{ padding: '3rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Zap size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Instant Sync</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Collaborate without refresh. Experience zero latency communication between your team members across 
                the entire project surface.
              </p>
           </div>
        </div>
      </main>

      <footer style={{ padding: '8rem 2rem', borderTop: '1px solid #222', textAlign: 'center' }}>
         <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '3rem' }}>Ready to professionalize?</h2>
         <Link href="/login?signup=true" style={{ background: '#f3f4f6', color: '#0a0a0a', padding: '1rem 3rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 800 }}>Start for Free</Link>
      </footer>
    </div>
  )
}
