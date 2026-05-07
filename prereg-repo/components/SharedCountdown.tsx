'use client'

import { motion } from 'framer-motion'
import type { TimeLeft } from '@/hooks/useLaunchData'

function CountBlock({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '64px' }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>{String(value).padStart(2, '0')}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}

export default function SharedCountdown({ timeLeft }: { timeLeft: TimeLeft }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}
    >
      <CountBlock value={timeLeft.days} label="Days" />
      <CountBlock value={timeLeft.hours} label="Hours" />
      <CountBlock value={timeLeft.minutes} label="Minutes" />
      <CountBlock value={timeLeft.seconds} label="Seconds" />
    </motion.div>
  )
}
