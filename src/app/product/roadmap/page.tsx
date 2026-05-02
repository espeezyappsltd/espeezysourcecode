'use client'

import React from 'react'
import Link from 'next/link'
import { Milestone, Target, Flag, Route, CheckCircle2, ArrowRight } from 'lucide-react'

export default function RoadmapPage() {
  const intervals = [
    { name: 'Interval 1', label: 'Initialization', desc: 'Concept definition and team member synchronization.' },
    { name: 'Interval 2', label: 'Structural Design', desc: 'Defining module boundaries and structural architecture.' },
    { name: 'Interval 3', label: 'Core Execution', desc: 'The build phase where work frequency is at its peak.' },
    { name: 'Interval 4', label: 'Audit & Integration', desc: 'Verifying contributions and refining cross-module logic.' },
    { name: 'Interval 5', label: 'Finalization', desc: 'Protocol check and final project submission.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f3f4f6' }}>
      
      <nav style={{ 
        height: '64px', borderBottom: '1px solid #222', 
        display: 'flex', alignItems: 'center', gap: '2rem',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)'
      }}>
        <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>← Back</Link>
        <span style={{ fontWeight: 700 }}>Academic Roadmap</span>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '8rem 2rem' }}>
        <section style={{ marginBottom: '10rem' }}>
          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>Strategic Workflow</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '2.5rem' }}>
            5-Stage academic <br /> 
            <span style={{ color: '#10b981' }}>success intervals.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: '800px', marginBottom: '4rem' }}>
            The Roadmap protocol enables academic teams to move beyond ad-hoc collaboration. We categorize every project into 
            five distinct intervals, ensuring clarity and accountability at every stage of the research lifecycle.
          </p>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', marginBottom: '8rem' }}>
           {intervals.map((interval, i) => (
             <div key={i} style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', background: '#111', 
                  border: '2px solid #222', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', color: '#10b981', fontWeight: 900, fontSize: '1.25rem',
                  flexShrink: 0
                }}>
                  {i + 1}
                </div>
                <div>
                   <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f3f4f6' }}>{interval.label}</h3>
                   <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1rem' }}>{interval.name}</div>
                   <p style={{ color: '#9ca3af', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '600px' }}>
                      {interval.desc}
                   </p>
                </div>
             </div>
           ))}
        </div>

        <section style={{ padding: '6rem', background: '#111', borderRadius: '32px', border: '1px solid #222', textAlign: 'center' }}>
           <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Map your next project.</h2>
           <p style={{ marginBottom: '3rem', color: '#9ca3af' }}>Join 1,200+ students using the Espeezy Roadmap protocol.</p>
           <Link href="/login?signup=true" style={{ background: '#10b981', color: '#0a0a0a', padding: '1rem 3rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
              Launch Roadmap <ArrowRight size={20} />
           </Link>
        </section>
      </main>
    </div>
  )
}
