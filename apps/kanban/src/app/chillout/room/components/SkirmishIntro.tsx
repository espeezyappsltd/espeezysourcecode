'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function SkirmishIntro() {
  return (
    <motion.div
      style={{
        height: 'var(--vh-dynamic)',
        background: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <motion.div initial={{ scale: 0.5, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
        <Zap size={120} className="text-brand" fill="var(--brand)" style={{ filter: 'drop-shadow(0 0 30px rgba(var(--brand-rgb), 0.5))' }} />
      </motion.div>
      <h1 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-0.06em', marginTop: '2rem' }}>
        SKIRMISH <span style={{ color: 'var(--brand)' }}>ACTIVE</span>
      </h1>
      <p style={{ color: 'var(--text-sub)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em' }}>
        Assembling Virtual Shards...
      </p>
    </motion.div>
  )
}
