'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomeLanding() {
  return (
    <div
      style={{
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
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(16,185,129,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.02) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          maxWidth: '800px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeIn 1s ease-out',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2.5rem',
            boxShadow: '0 20px 40px rgba(16,185,129,0.2)',
          }}
        >
          <Image src="/brand_logo2.svg" width={48} height={48} alt="Espeezy Logo" />
        </div>

        <h1
          style={{
            fontSize: 'clamp(3rem, 10vw, 5rem)',
            fontWeight: 950,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            marginBottom: '1.5rem',
            background: 'linear-gradient(to bottom, #fff 0%, #aaa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Espeezy Monorepo
        </h1>

        <p
          style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6,
            marginBottom: '3rem',
            fontWeight: 500,
            maxWidth: '600px',
            margin: '0 auto 3rem',
          }}
        >
          Unified dev control plane for every app under <code>apps/</code>. Start servers, stream logs, and run shell
          commands from one dashboard.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              padding: '1rem 2.5rem',
              borderRadius: '16px',
              background: '#10b981',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.1rem',
              textDecoration: 'none',
              boxShadow: '0 10px 20px rgba(16,185,129,0.15)',
            }}
          >
            Dev Hub login
          </Link>
          <a
            href="https://kanban.espeezy.com"
            style={{
              padding: '1rem 2.5rem',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.1rem',
              textDecoration: 'none',
            }}
          >
            Open Kanban
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
