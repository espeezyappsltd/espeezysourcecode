'use client'

import Link from 'next/link'
import { Sparkles, Zap, ArrowRight, ShieldCheck, Globe, Cpu } from 'lucide-react'
import UserCount from '@/components/UserCount'
import { motion } from 'framer-motion'

export default function LandingHero() {
  return (
    <section
      style={{
        textAlign: 'center',
        padding: 'clamp(2rem, 10vw, 8rem) 1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Premium Gradients */}
      <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1 }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: -1 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '10px 24px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          borderRadius: '100px',
          color: 'var(--brand)',
          fontSize: '0.75rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <Sparkles size={14} className="shimmer-gold" /> Built for L5 and L6 Students.
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{
          marginBottom: '1.5rem',
          color: '#f3f4f6',
          maxWidth: '1000px',
          margin: '0 auto 2rem',
          fontWeight: 950,
          letterSpacing: '-0.05em',
          lineHeight: 0.95,
          fontSize: 'clamp(3rem, 10vw, 6.5rem)'
        }}
      >
        The simple way to <br />
        <span style={{
          background: 'linear-gradient(135deg, var(--brand) 0%, #ffffff 80%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}>work as a team.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        style={{
          color: 'rgba(255,255,255,0.6)',
          maxWidth: '800px',
          margin: '0 auto 4rem',
          fontWeight: 500,
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          lineHeight: 1.5,
          letterSpacing: '-0.01em'
        }}
      >
        Stay organized, track your group projects, and get the recognition you deserve for your hard work.
        <span style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          marginTop: '1.5rem',
          color: 'var(--brand)',
          fontWeight: 800,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          opacity: 0.8
        }}>
          <ShieldCheck size={14} /> SECURE FOR STUDENTS • ALWAYS SAVED
        </span>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <Link
          href="/login?signup=true&plan=pro"
          style={{
            background: 'var(--brand)',
            color: '#0a0a0a',
            textDecoration: 'none',
            padding: '1.4rem 3.5rem',
            fontSize: '1.1rem',
            fontWeight: 950,
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 20px 40px rgba(var(--brand-rgb), 0.3)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          className="premium-btn-hover"
        >
          Upgrade to Pro <Zap size={20} fill="#0a0a0a" />
        </Link>
        <Link
          href="/login?signup=true"
          style={{
            background: 'rgba(255,255,255,0.02)',
            color: 'white',
            textDecoration: 'none',
            padding: '1.4rem 3.5rem',
            fontSize: '1.1rem',
            fontWeight: 800,
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: '0.3s'
          }}
          className="glass-btn-hover"
        >
          Try for Free <ArrowRight size={18} />
        </Link>
      </motion.div>

      <style jsx>{`
         .premium-btn-hover:hover {
           transform: translateY(-5px) scale(1.02);
           box-shadow: 0 25px 50px rgba(var(--brand-rgb), 0.4);
         }
         .glass-btn-hover:hover {
           background: rgba(255,255,255,0.05);
           border-color: rgba(255,255,255,0.2);
         }
         .shimmer-gold {
           animation: gold-shimmer 2s infinite linear;
         }
         @keyframes gold-shimmer {
           0% { opacity: 0.5; }
           50% { opacity: 1; color: #fbbf24; }
           100% { opacity: 0.5; }
         }
       `}</style>
    </section>
  )
}
