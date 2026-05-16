'use client'

import { motion } from 'framer-motion'
import { CHILLOUT_TOPICS } from '../constants'
import type { ChilloutTopic } from '../types'

type Props = {
  onSelectTopic: (topic: ChilloutTopic) => void
}

export function ChilloutTopicStep({ onSelectTopic }: Props) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {CHILLOUT_TOPICS.map((topic) => {
        const Icon = topic.icon
        return (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic)}
            className="glass hover-card"
            aria-label={`Select topic: ${topic.name}. ${topic.description}`}
            style={{
              padding: '2rem',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              textAlign: 'left',
              background: 'var(--surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `rgba(${topic.id === 'cyber_ethics' ? '239, 68, 68' : 'var(--brand-rgb)'}, 0.1)`,
                color: topic.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={28} aria-hidden="true" />
            </div>
            <motion.div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-main)',
                }}
              >
                {topic.name}
              </h3>
              <p
                style={{
                  margin: '0.5rem 0 0',
                  fontSize: '0.85rem',
                  color: 'var(--text-sub)',
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              >
                {topic.description}
              </p>
            </motion.div>
          </button>
        )
      })}
    </motion.div>
  )
}
