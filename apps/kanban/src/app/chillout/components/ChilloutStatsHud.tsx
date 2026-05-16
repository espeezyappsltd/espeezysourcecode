'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ChilloutUserStats } from '../types'

type Props = {
  userStats: ChilloutUserStats | null
}

export function ChilloutStatsHud({ userStats }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface)',
          padding: '1.25rem 2rem',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, var(--brand), #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 950,
                fontSize: '1.5rem',
                boxShadow: '0 8px 16px rgba(var(--brand-rgb), 0.3)',
              }}
            >
              {userStats?.level ?? 1}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -5,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--brand)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.6rem',
                fontWeight: 900,
                whiteSpace: 'nowrap',
              }}
            >
              LVL
            </div>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.02em' }}>
              {userStats?.rank_title ?? 'Novice Scholar'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem' }}>
              <div
                style={{
                  width: '200px',
                  height: '6px',
                  background: 'var(--bg-main)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(userStats?.total_xp ?? 0) % 100}%` }}
                  style={{ height: '100%', background: 'var(--brand)' }}
                />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-sub)' }}>
                {userStats?.total_xp ?? 0} XP Total
              </span>
            </div>
          </div>
        </motion.div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 950 }}>{userStats?.wins ?? 0}</div>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--text-sub)',
                textTransform: 'uppercase',
              }}
            >
              Wins
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 950 }}>{userStats?.games_played ?? 0}</div>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--text-sub)',
                textTransform: 'uppercase',
              }}
            >
              Battles
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
