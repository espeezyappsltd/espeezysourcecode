'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { DIFFICULTY_OPTIONS, GAME_MODE_OPTIONS, ROUND_OPTIONS } from '../constants'
import type { ChilloutDifficulty, ChilloutGameMode } from '../types'

type Props = {
  difficulty: ChilloutDifficulty
  gameMode: ChilloutGameMode
  roundCount: number
  onDifficultyChange: (d: ChilloutDifficulty) => void
  onGameModeChange: (m: ChilloutGameMode) => void
  onRoundCountChange: (r: number) => void
  onBack: () => void
  onInitialize: () => void
}

const optionButtonStyle = (selected: boolean): CSSProperties => ({
  flex: 1,
  padding: '1rem',
  borderRadius: '14px',
  border: '2px solid',
  borderColor: selected ? 'var(--brand)' : 'var(--border)',
  background: selected ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)',
  color: selected ? 'var(--text-main)' : 'var(--text-sub)',
  fontWeight: 900,
  cursor: 'pointer',
  transition: '0.2s',
})

export function ChilloutConfigStep({
  difficulty,
  gameMode,
  roundCount,
  onDifficultyChange,
  onGameModeChange,
  onRoundCountChange,
  onBack,
  onInitialize,
}: Props) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        background: 'var(--surface)',
        borderRadius: '32px',
        border: '1px solid var(--border)',
        padding: '2.5rem',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <h2 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '2rem' }}>Configure Skirmish</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--text-sub)',
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            Challenge Level
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
                aria-pressed={difficulty === d}
                style={optionButtonStyle(difficulty === d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--text-sub)',
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            Grading Protocol
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {GAME_MODE_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => onGameModeChange(m)}
                aria-pressed={gameMode === m}
                style={{ ...optionButtonStyle(gameMode === m), textAlign: 'left' }}
              >
                <div style={{ fontWeight: 950 }}>{m}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px' }}>
                  {m === 'Speed Recall' ? 'Reveal & choices' : 'Text input + AI Grade'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--text-sub)',
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            Skirmish Depth
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {ROUND_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => onRoundCountChange(r)}
                aria-pressed={roundCount === r}
                style={optionButtonStyle(roundCount === r)}
              >
                {r} Rounds
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ flex: 1 }}>
          Back
        </button>
        <button onClick={onInitialize} className="btn btn-primary" style={{ flex: 2, fontWeight: 950 }}>
          INITIALIZE AI ENGINE
        </button>
      </div>
    </motion.div>
  )
}
