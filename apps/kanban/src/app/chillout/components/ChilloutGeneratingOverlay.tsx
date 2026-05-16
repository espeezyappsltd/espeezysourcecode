'use client'

import { motion } from 'framer-motion'
import { Dna } from 'lucide-react'
import type { ChilloutDifficulty, ChilloutTopic } from '../types'

type Props = {
  difficulty: ChilloutDifficulty
  selectedTopic: ChilloutTopic | null
}

export function ChilloutGeneratingOverlay({ difficulty, selectedTopic }: Props) {
  return (
    <div
      style={{
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
        <Dna size={80} style={{ color: 'var(--brand)' }} />
      </motion.div>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 950,
          letterSpacing: '-0.03em',
          marginBottom: '0.5rem',
          marginTop: '2rem',
        }}
      >
        Synthesizing Shards
      </h2>
      <p style={{ color: 'var(--text-sub)', fontWeight: 700, fontSize: '0.85rem' }}>
        Constructing {difficulty} logic for {selectedTopic?.name}...
      </p>
    </div>
  )
}
