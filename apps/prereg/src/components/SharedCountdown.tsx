'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { TimeLeft } from '@/hooks/useLaunchData'

function CountBlock({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '70px' }}>
      <div style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 950, color: 'white', letterSpacing: '-0.06em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: '6px' }}>
        {label}
      </div>
    </div>
  )
}

function Separator() {
  return <div style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 950, color: 'rgba(255,255,255,0.2)', lineHeight: 1, alignSelf: 'flex-start', marginTop: '4px' }}>:</div>
}

export default function SharedCountdown({ timeLeft }: { timeLeft: TimeLeft }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', margin: '0 auto 2.5rem', flexWrap: 'wrap' }}>
      <CountBlock value={timeLeft.days} label="Days" />
      <Separator />
      <CountBlock value={timeLeft.hours} label="Hours" />
      <Separator />
      <CountBlock value={timeLeft.minutes} label="Minutes" />
      <Separator />
      <CountBlock value={timeLeft.seconds} label="Seconds" />
    </motion.div>
  )
}
