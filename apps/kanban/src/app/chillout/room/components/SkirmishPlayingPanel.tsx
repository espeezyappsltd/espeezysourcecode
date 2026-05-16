'use client'

import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Loader2 } from 'lucide-react'
import { SkirmishTimer } from '@/components/skirmish/SkirmishTimer'
import type { QuizQuestion } from '@/types/quiz'

type SkirmishConfig = { difficulty?: string; mode?: string }

type PresencePeer = { userId: string; name?: string }

type Props = {
  currentQ: QuizQuestion
  currentIdx: number
  config: SkirmishConfig
  roundStartTime: number | undefined
  timerDuration: number
  activeTurnId: string | null | undefined
  profileId: string | undefined
  isMyTurn: boolean
  others: PresencePeer[]
  selectedOption: number | null
  hasAnswered: boolean
  textAnswer: string
  setTextAnswer: (v: string) => void
  isRevealed: boolean
  setIsRevealed: (v: boolean) => void
  isGrading: boolean
  aiCritique: string
  onTimeOut: () => void
  onMCSelect: (idx: number) => void
  onAIEvaluation: () => void
  onSpeedRecallMiss: () => void
  onSpeedRecallHit: () => void
}

export function SkirmishPlayingPanel({
  currentQ,
  currentIdx,
  config,
  roundStartTime,
  timerDuration,
  activeTurnId,
  profileId,
  isMyTurn,
  others,
  selectedOption,
  hasAnswered,
  textAnswer,
  setTextAnswer,
  isRevealed,
  setIsRevealed,
  isGrading,
  aiCritique,
  onTimeOut,
  onMCSelect,
  onAIEvaluation,
  onSpeedRecallMiss,
  onSpeedRecallHit,
}: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <motion.div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(var(--brand-rgb), 0.1)',
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 950,
              fontSize: '1.25rem',
            }}
          >
            {currentIdx + 1}
          </motion.div>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.15em' }}>
              Round Progress
            </div>
            <div style={{ fontWeight: 850 }}>
              {config?.mode || 'Battle'} <span style={{ color: 'var(--text-sub)' }}>({config?.difficulty || 'Standard'})</span>
            </div>
          </div>
        </div>

        <SkirmishTimer
          roundStartTime={roundStartTime || 0}
          timerDuration={timerDuration || 20}
          activeTurnId={activeTurnId ?? null}
          currentProfileId={profileId ?? null}
          onTimeOut={onTimeOut}
        />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem', minHeight: '120px' }}>
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentIdx}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              fontSize: '2.25rem',
              fontWeight: 950,
              color: 'var(--text-main)',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
            }}
          >
            {currentQ.question}
          </motion.h2>
        </AnimatePresence>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center' }}>
          <motion.div
            animate={
              isMyTurn
                ? {
                    scale: [1, 1.05, 1],
                    boxShadow: ['0 0 0px var(--brand)', '0 0 20px var(--brand)', '0 0 0px var(--brand)'],
                  }
                : {}
            }
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              padding: '6px 16px',
              background: isMyTurn ? 'var(--brand)' : 'var(--bg-sub)',
              color: isMyTurn ? 'white' : 'var(--text-sub)',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 950,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {isMyTurn
              ? '⚡ IT IS YOUR TURN TO SYNTHESIZE'
              : `🔍 ${others.find((o) => o.userId === activeTurnId)?.name || 'A Peer'} is currently being evaluated...`}
          </motion.div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {currentQ?.type === 'multiple_choice' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {currentQ.options?.map((opt: string, i: number) => {
              const isCorrect = hasAnswered && i === currentQ.correctAnswer
              const isWrong = hasAnswered && selectedOption === i && i !== currentQ.correctAnswer
              return (
                <button
                  key={i}
                  disabled={!isMyTurn || hasAnswered}
                  onClick={() => onMCSelect(i)}
                  className="glass"
                  style={{
                    padding: '1.5rem',
                    borderRadius: '20px',
                    border: '2px solid',
                    borderColor: isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : selectedOption === i ? 'var(--brand)' : 'var(--border)',
                    background: isCorrect ? 'rgba(var(--success-rgb), 0.05)' : 'var(--surface)',
                    textAlign: 'left',
                    fontWeight: 800,
                    cursor: isMyTurn ? 'pointer' : 'default',
                    transition: '0.2s',
                    width: '100%',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {config?.mode === 'Speed Recall' && currentQ?.type === 'explanation' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <AnimatePresence>
              {isRevealed ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '2rem',
                    background: 'rgba(var(--brand-rgb), 0.03)',
                    borderRadius: '24px',
                    border: '1px dashed var(--brand)',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--brand)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Correct Answer
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{currentQ?.correctAnswer}</div>
                </motion.div>
              ) : (
                <button onClick={() => setIsRevealed(true)} className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '16px', fontWeight: 950 }}>
                  REVEAL FLUX
                </button>
              )}
            </AnimatePresence>

            {isRevealed && isMyTurn && !hasAnswered && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={onSpeedRecallMiss} className="btn" style={{ background: 'var(--error)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 900 }}>
                  MISSED IT
                </button>
                <button
                  onClick={() => {
                    confetti()
                    onSpeedRecallHit()
                  }}
                  className="btn"
                  style={{ background: 'var(--success)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 900 }}
                >
                  GOT IT!
                </button>
              </div>
            )}
          </div>
        )}

        {config?.mode === 'AI Evaluated' && currentQ?.type === 'explanation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={!isMyTurn || hasAnswered}
              placeholder="Synthesize your explanation here..."
              style={{
                width: '100%',
                height: '140px',
                background: 'var(--bg-sub)',
                border: '2px solid var(--border)',
                borderRadius: '20px',
                padding: '1.5rem',
                color: 'var(--text-main)',
                fontSize: '1rem',
                outline: 'none',
                resize: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 600 }}>{textAnswer.length} characters used</div>
              <button
                onClick={onAIEvaluation}
                disabled={!isMyTurn || hasAnswered || isGrading || !textAnswer.trim()}
                className="btn btn-primary"
                style={{ padding: '0.8rem 2.5rem', borderRadius: '14px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                {isGrading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                DEPLOY FOR GRADING
              </button>
            </div>
            {aiCritique && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: '1rem 1.5rem', background: 'var(--bg-main)', borderLeft: '4px solid var(--brand)', borderRadius: '0 12px 12px 0' }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase' }}>Judge&apos;s Critique:</span>
                <p style={{ margin: '4px 0 0', fontWeight: 700, fontStyle: 'italic' }}>&quot;{aiCritique}&quot;</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
