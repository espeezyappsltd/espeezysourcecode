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

interface UserRegistrationCounterProps {
  registeredCount: number
  goal: number
}

export default function UserRegistrationCounter({ registeredCount, goal }: UserRegistrationCounterProps) {
  const progressPct = Math.min(100, Math.round((registeredCount / goal) * 100))

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 0.5 }}
      style={{ maxWidth: '520px', margin: '0 auto 4rem', width: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
          <AnimatedNumber value={registeredCount} /> registered
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
          Goal: {goal.toLocaleString()}
        </span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${progressPct}%` }} 
          transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
          style={{ 
            height: '100%', 
            background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)', 
            borderRadius: '100px' 
          }} 
        />
      </div>
      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.5rem', textAlign: 'center' }}>
        {progressPct < 1 ? 'Be among the first.' : `${progressPct}% of the way to launch goal`}
      </p>
    </motion.div>
  )
}
