'use client'

import React, { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'

interface SkirmishTimerProps {
  roundStartTime: number
  timerDuration: number
  activeTurnId: string | null
  currentProfileId: string | null
  onTimeOut: () => void
}

/**
 * Highly optimized timer component that prevents parent re-renders.
 * Uses local state and an internal interval.
 */
export const SkirmishTimer = memo(function SkirmishTimer({
  roundStartTime,
  timerDuration,
  activeTurnId,
  currentProfileId,
  onTimeOut
}: SkirmishTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timerDuration)

  useEffect(() => {
    if (!roundStartTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartTime) / 1000)
      const remaining = Math.max(0, timerDuration - elapsed)
      setTimeLeft(remaining)

      if (remaining === 0 && activeTurnId === currentProfileId) {
        onTimeOut()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [roundStartTime, timerDuration, activeTurnId, currentProfileId, onTimeOut])

  // Calculate Dash Offset for the SVG circle
  const circumference = 163.36
  const progress = 1 - (timeLeft / timerDuration)
  const dashOffset = circumference * progress

  return (
    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
      <svg style={{ transform: 'rotate(-90deg)', width: '60px', height: '60px' }}>
        <circle cx="30" cy="30" r="26" fill="none" stroke="var(--border)" strokeWidth="4" />
        <motion.circle 
          cx="30" cy="30" r="26" fill="none" stroke="var(--brand)" strokeWidth="4"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '0.9rem', fontFamily: 'monospace' }}>
        {timeLeft}s
      </div>
    </div>
  )
})
