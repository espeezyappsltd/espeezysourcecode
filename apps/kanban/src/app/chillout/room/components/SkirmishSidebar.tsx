'use client'

import type { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'
import type { QuizScoreEntry } from '@/types/quiz'

type PresencePeer = {
  userId: string
  name?: string
  avatar?: string
}

type Props = {
  scores: QuizScoreEntry[]
  profile: Profile | null
  others: PresencePeer[]
  activeTurnId: string | null | undefined
  router: ReturnType<typeof useRouter>
}

export function SkirmishSidebar({ scores, profile, others, activeTurnId, router }: Props) {
  const sorted = scores ? [...scores].sort((a, b) => b.points - a.points) : []

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          flex: 1,
          background: 'var(--surface)',
          borderRadius: '32px',
          border: '1px solid var(--border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h3
          style={{
            fontSize: '0.75rem',
            fontWeight: 950,
            textTransform: 'uppercase',
            color: 'var(--text-sub)',
            letterSpacing: '0.15em',
            marginBottom: '1.5rem',
          }}
        >
          Skirmish Standings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sorted.map((s, idx) => (
            <div
              key={s.userId}
              style={{
                padding: '1rem',
                borderRadius: '16px',
                background: s.userId === profile?.id ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '24px',
                  fontWeight: 950,
                  color: idx === 0 ? '#fbbf24' : 'var(--text-sub)',
                  fontSize: '1.1rem',
                }}
              >
                {idx + 1}.
              </div>
              <div style={{ flex: 1, fontWeight: 850, fontSize: '0.9rem' }}>{s.userName}</div>
              <div style={{ fontWeight: 1000, color: 'var(--brand)', fontSize: '1.1rem' }}>{s.points}</div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 600 }}>
              Initializing Standings...
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 950,
              textTransform: 'uppercase',
              color: 'var(--text-sub)',
              marginBottom: '1rem',
            }}
          >
            Room Population ({others.length + 1})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'var(--brand)',
                padding: '2px',
                border: activeTurnId === profile?.id ? '2px solid var(--success)' : 'none',
              }}
            >
              <img src={profile?.avatar_url || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
            </div>
            {others.map((o) => (
              <div
                key={o.userId}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'var(--bg-sub)',
                  padding: '2px',
                  border: activeTurnId === o.userId ? '2px solid var(--success)' : 'none',
                }}
              >
                <img src={o.avatar || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push('/chillout')}
        className="btn btn-secondary"
        style={{ width: '100%', padding: '1.25rem', borderRadius: '20px', fontWeight: 950, color: 'var(--error)', borderColor: '#ef444433' }}
      >
        ABANDON SKIRMISH
      </button>
    </aside>
  )
}
