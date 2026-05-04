'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TimeLeft } from '@/hooks/useLaunchData'

interface CountBlockProps {
  value: number
  label: string
}

function CountBlock({ value, label }: CountBlockProps) {
  return (
    <div style={{ textAlign: 'center', minWidth: '70px' }}>
      <div style={{ 
        fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
        fontWeight: 950, 
        color: 'white', 
        letterSpacing: '-0.06em', 
        lineHeight: 1, 
        fontVariantNumeric: 'tabular-nums' 
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ 
        fontSize: '0.65rem', 
        fontWeight: 700, 
        color: 'rgba(255,255,255,0.3)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.18em', 
        marginTop: '6px' 
      }}>
        {label}
      </div>
    </div>
  )
}

interface SharedCountdownProps {
  timeLeft: TimeLeft
}

export default function SharedCountdown({ timeLeft }: SharedCountdownProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.6, delay: 0.35 }}
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 'clamp(1rem, 4vw, 2.5rem)', 
        marginBottom: '3.5rem', 
        flexWrap: 'wrap' 
      }}
    >
      <CountBlock value={timeLeft.days} label="Days" />
      <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#10b981', opacity: 0.4, marginBottom: '1rem' }}>:</div>
      <CountBlock value={timeLeft.hours} label="Hours" />
      <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#10b981', opacity: 0.4, marginBottom: '1rem' }}>:</div>
      <CountBlock value={timeLeft.minutes} label="Min" />
      <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#10b981', opacity: 0.4, marginBottom: '1rem' }}>:</div>
      <CountBlock value={timeLeft.seconds} label="Sec" />
    </motion.div>
  )
}
