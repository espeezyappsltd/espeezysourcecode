'use client'

import { motion } from 'framer-motion'

export default function UserRegistrationCounter({
  registeredCount,
  goal,
}: {
  registeredCount: number
  goal: number
}) {
  const progressPct = Math.min(100, Math.round((registeredCount / goal) * 100))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--muted)' }}>
        <span>{registeredCount.toLocaleString()} registered</span>
        <span>Goal: {goal.toLocaleString()}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: '#1e2a28', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--brand), #34d399)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </motion.div>
  )
}
