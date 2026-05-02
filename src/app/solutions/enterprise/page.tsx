'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, ShieldCheck, Database, LayoutGrid, ArrowRight, BarChart3 } from 'lucide-react'

export default function EnterprisePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f3f4f6' }}>
      <nav style={{ 
        height: '64px', borderBottom: '1px solid #222', 
        display: 'flex', alignItems: 'center', gap: '2rem',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)'
      }}>
        <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>← Back</Link>
        <span style={{ fontWeight: 700 }}>Institutional Flow</span>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '8rem 2rem' }}>
        <section style={{ marginBottom: '10rem' }}>
          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>Enterprise Solutions</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '2.5rem' }}>
            Academic infrastructure <br /> 
            <span style={{ color: '#10b981' }}>at scale.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: '800px', marginBottom: '4rem' }}>
            Espeezy Enterprise provides departments and universities with the administrative visibility and security 
            necessary to manage thousands of concurrent academic collaborations.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
           <div style={{ padding: '3rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Building2 size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Departmental Control</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Centrally manage user access, project groups, and institutional data across your entire department with 
                advanced administrative permissions.
              </p>
           </div>
           <div style={{ padding: '3rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><ShieldCheck size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Enterprise Security</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Benefit from SSO integration, advanced encryption protocols, and dedicated security audits to ensure 
                institutional data integrity.
              </p>
           </div>
           <div style={{ padding: '3rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><BarChart3 size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Institutional Analytics</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Gain high-level insights into academic velocity and department-wide collaboration patterns to inform 
                resource allocation and support.
              </p>
           </div>
        </div>

        <div style={{ marginTop: '10rem', textAlign: 'center' }}>
           <Link href="/login?signup=true&plan=premium" style={{ 
             background: 'white', color: '#0a0a0a', padding: '1.25rem 3.5rem', 
             borderRadius: '20px', textDecoration: 'none', fontWeight: 900,
             display: 'inline-flex', alignItems: 'center', gap: '1rem',
             boxShadow: '0 25px 50px rgba(255, 255, 255, 0.1)'
           }}>
              Contact Institutional Sales <ArrowRight size={22} />
           </Link>
        </div>
      </main>
    </div>
  )
}
