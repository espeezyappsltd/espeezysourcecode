'use client'

import { motion } from 'framer-motion'
import type { QuizQuestion } from '@/types/quiz'

type Props = {
  questions: QuizQuestion[]
  onBack: () => void
  onProceed: () => void
}

export function ChilloutPreviewStep({ questions, onBack, onProceed }: Props) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        background: 'var(--surface)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        padding: '2rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 950, margin: 0 }}>Battle Log Configuration</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
            Re-Sync AI
          </button>
          <button onClick={onProceed} className="btn btn-primary" style={{ fontSize: '0.8rem', fontWeight: 950 }}>
            PROCEED TO INVITES
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {questions.map((q, i) => (
          <div
            key={i}
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: 'var(--bg-sub)',
              display: 'flex',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--brand)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '0.6rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(var(--brand-rgb), 0.1)',
                    color: 'var(--brand)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  {q.type}
                </span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--bg-main)',
                    color: 'var(--text-sub)',
                    fontWeight: 900,
                  }}
                >
                  D-IDX: {q.difficulty_multiplier || 1}
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{q.question}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
