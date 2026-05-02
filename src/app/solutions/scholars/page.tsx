'use client'

import React from 'react'
import Link from 'next/link'
import { GraduationCap, BookOpen, Fingerprint, Award, ArrowRight } from 'lucide-react'

export default function ScholarsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f3f4f6' }}>
      
      <nav style={{ 
        height: '64px', borderBottom: '1px solid #222', 
        display: 'flex', alignItems: 'center', gap: '2rem',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)'
      }}>
        <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>← Back</Link>
        <span style={{ fontWeight: 700 }}>For Scholars & Researchers</span>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '8rem 2rem' }}>
        <section style={{ marginBottom: '10rem' }}>
          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>Academic Solutions</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '2.5rem' }}>
            Elevating the <br /> 
            <span style={{ color: '#10b981' }}>individual researcher.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: '800px', marginBottom: '4rem' }}>
            Espeezy provides independent scholars with the architectural framework needed to manage complex 
            academic outputs with professional-grade verification protocols.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <GraduationCap size={48} color="#10b981" />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Academic Identity</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Build a verifiable portfolio of your collaboration history. Prove your contribution to every project 
                through our integrated audit system.
              </p>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Award size={48} color="#10b981" />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Verified Credentials</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                 Every task completed and every milestone reached contributes to your global scholar score, 
                 making your academic effort visible to the whole network.
              </p>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Fingerprint size={48} color="#10b981" />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>IP Protection</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Our protocols ensure that your unique research inputs are timestamped and attributed, protecting your 
                intellectual contributions within group settings.
              </p>
           </div>
        </div>

        <div style={{ marginTop: '10rem', textAlign: 'center' }}>
           <Link href="/login?signup=true" style={{ 
             background: 'var(--brand)', color: 'white', padding: '1.25rem 3rem', 
             borderRadius: '16px', textDecoration: 'none', fontWeight: 900,
             display: 'inline-flex', alignItems: 'center', gap: '1rem',
             boxShadow: '0 20px 40px rgba(var(--brand-rgb), 0.2)'
           }}>
              Join as a Scholar <ArrowRight size={22} />
           </Link>
        </div>
      </main>
    </div>
  )
}
