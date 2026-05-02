'use client'

import React from 'react'
import Link from 'next/link'
import { Users, LayoutGrid, MessageSquare, Zap, ArrowRight, Activity } from 'lucide-react'

export default function TeamsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f3f4f6' }}>
      <nav style={{ 
        height: '64px', borderBottom: '1px solid #222', 
        display: 'flex', alignItems: 'center', gap: '2rem',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)'
      }}>
        <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>← Back</Link>
        <span style={{ fontWeight: 700 }}>For Team Collaboration</span>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '8rem 2rem' }}>
        <section style={{ marginBottom: '10rem' }}>
          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>Synergistic Execution</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '2.5rem' }}>
            Unified command <br /> 
            <span style={{ color: '#10b981' }}>for student teams.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: '800px', marginBottom: '4rem' }}>
            Espeezy eliminates the overhead of managing academic groups. We provide a single source of truth 
            for tasks, timelines, and communications, enabling teams to focus on research quality.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
           <div style={{ padding: '2.5rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Users size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Synchronized Peers</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                See your team&apos;s real-time presence and activity dots. Know who is online and what they are working 
                on without sending a single status update message.
              </p>
           </div>
           <div style={{ padding: '2.5rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><LayoutGrid size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Centralized Workflow</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                 Maintain one unified Kanban board for the entire team. Track sub-tasks, assign owners, and watch 
                 progress happen in real-time across all devices.
              </p>
           </div>
           <div style={{ padding: '2.5rem', background: '#111', borderRadius: '24px', border: '1px solid #222' }}>
              <div style={{ color: '#10b981', marginBottom: '1.5rem' }}><Activity size={40} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Team Velocity</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
                Automated analytics track your group&apos;s collective effort, providing insights into team health and 
                identifying potential bottlenecks early.
              </p>
           </div>
        </div>

        <div style={{ marginTop: '10rem', padding: '6rem', borderRadius: '32px', background: 'linear-gradient(135deg, #111, #0a0a0a)', border: '1px solid #222', textAlign: 'center' }}>
           <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>Accelerate your team output.</h2>
           <Link href="/login?signup=true" style={{ background: '#10b981', color: '#0a0a0a', padding: '1rem 3rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
              Create a Group <ArrowRight size={20} />
           </Link>
        </div>
      </main>
    </div>
  )
}
