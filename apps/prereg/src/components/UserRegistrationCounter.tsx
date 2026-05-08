'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = display
    const end = value
    if (start === end) return
    const step = Math.max(1, Math.floor((end - start) / 60))
    const id = setInterval(() => {
      start = Math.min(start + step, end)
      setDisplay(start)
      if (start >= end) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <>{display.toLocaleString()}</>
}

export default function UserRegistrationCounter({ registeredCount, goal, authUserCount = 0 }: { registeredCount: number; goal: number; authUserCount?: number }) {
  const progressPct = Math.min(100, Math.round((registeredCount / goal) * 100))
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      style={{ maxWidth: '520px', margin: '0 auto 4rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
          <AnimatedNumber value={registeredCount} /> registered
        </span>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
          Goal: {(goal).toLocaleString()}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Registration progress: ${registeredCount.toLocaleString()} of ${goal.toLocaleString()} registered (${progressPct}%)`}
        style={{ height: '6px', background: 'rgba(15,23,42,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--brand), #34d399)', borderRadius: '100px' }}
        />
      </div>
      <div style={{ textAlign: 'right', marginTop: '0.4rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{progressPct}% of goal</span>
      </div>
      {authUserCount > 0 && (
        <div style={{ textAlign: 'right', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
            Includes {authUserCount.toLocaleString()} Supabase account{authUserCount === 1 ? '' : 's'}
          </span>
        </div>
      )}
    </motion.div>
  )
}
