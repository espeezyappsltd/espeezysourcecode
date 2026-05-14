'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      color: 'white', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ── Background decoration ─────────────────────────────────────────── */}
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.02) 1px, transparent 1px)', 
        backgroundSize: '64px 64px', 
        pointerEvents: 'none' 
      }} />
      <div style={{ 
        position: 'absolute', 
        top: '10%', 
        left: '10%', 
        width: '40vw', 
        height: '40vw', 
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', 
        filter: 'blur(100px)', 
        pointerEvents: 'none' 
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '10%', 
        right: '10%', 
        width: '40vw', 
        height: '40vw', 
        background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 70%)', 
        filter: 'blur(100px)', 
        pointerEvents: 'none' 
      }} />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ 
        maxWidth: '800px', 
        textAlign: 'center', 
        position: 'relative', 
        zIndex: 1,
        animation: 'fadeIn 1s ease-out'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          width: '80px', 
          height: '80px', 
          borderRadius: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 2.5rem',
          boxShadow: '0 20px 40px rgba(16,185,129,0.2)'
        }}>
          <Image src="/brand_logo2.svg" width={48} height={48} alt="Espeezy Logo" />
        </div>

        <h1 style={{ 
          fontSize: 'clamp(3rem, 10vw, 5rem)', 
          fontWeight: 950, 
          letterSpacing: '-0.04em', 
          lineHeight: 0.95, 
          marginBottom: '1.5rem',
          background: 'linear-gradient(to bottom, #fff 0%, #aaa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Espeezy Monorepo
        </h1>

        <p style={{ 
          fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', 
          color: 'rgba(255,255,255,0.5)', 
          lineHeight: 1.6, 
          marginBottom: '3rem',
          fontWeight: 500,
          maxWidth: '600px',
          margin: '0 auto 3rem'
        }}>
          A unified workspace for high-performance academic collaboration. 
          The infrastructure is verified and optimized for institutional deployment.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{ 
            padding: '1rem 2.5rem', 
            borderRadius: '16px', 
            background: '#10b981', 
            color: 'white', 
            fontWeight: 800, 
            fontSize: '1.1rem', 
            textDecoration: 'none',
            boxShadow: '0 10px 20px rgba(16,185,129,0.15)',
            transition: 'transform 0.2s'
          }}>
            Access Terminal
          </Link>
          <a href="https://kanban.espeezy.com" style={{ 
            padding: '1rem 2.5rem', 
            borderRadius: '16px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', 
            fontWeight: 800, 
            fontSize: '1.1rem', 
            textDecoration: 'none',
            transition: 'background 0.2s'
          }}>
            Open Kanban MVP
          </a>
        </div>
      </div>

      <div style={{ 
        marginTop: '6rem', 
        display: 'flex', 
        gap: '2.5rem', 
        color: 'rgba(255,255,255,0.2)', 
        fontSize: '0.75rem', 
        fontWeight: 900, 
        textTransform: 'uppercase', 
        letterSpacing: '0.15em' 
      }}>
        <span>Verified Infrastructure</span>
        <span>Institutional Grade</span>
        <span>Secure Protocol</span>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
