'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CYCLING_NAMES = [
  'Emma Thompson',
  'James Wilson',
  'Sofia Martinez',
  'Michael Chen',
  'Olivia Brown',
  'David Kim',
  'Ava Johnson',
  'Noah Williams',
  'Isabella Garcia',
  'Liam Anderson',
  'Mia Taylor',
  'Ethan Lee',
  'Charlotte Davis',
  'Alexander Moore',
  'Amelia Clark',
  'Daniel Rodriguez',
  'Harper Lewis',
  'Benjamin Walker',
  'Evelyn Hall',
  'Lucas Young',
]

const CYCLE_MS = 2400

export function CyclingNamePlaceholder({ id }: { id: string }) {
  const [index, setIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % CYCLING_NAMES.length)
    }, CYCLE_MS)
    return () => clearInterval(id)
  }, [reduceMotion])

  const name = CYCLING_NAMES[index]

  return (
    <div
      id={id}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '1rem',
        right: '1rem',
        top: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {reduceMotion ? (
        <span
          style={{
            display: 'block',
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'var(--text-sub)',
            opacity: 0.5,
          }}
        >
          e.g. Emma Thompson
        </span>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={name}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 0.5 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'block',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'var(--text-sub)',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

export function isMockDisplayName(name?: string | null): boolean {
  if (!name?.trim()) return true
  const normalized = name.trim().toLowerCase()
  return normalized === 'test user' || normalized === 'testuser'
}
