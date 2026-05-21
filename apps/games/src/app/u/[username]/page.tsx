import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildKanbanAppUrl } from '@shared/app-url'

export const dynamic = 'force-dynamic'

export default async function GamesPublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const slug = username.trim().toLowerCase().replace(/^@/, '')
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, bio, subscription_plan, created_at, account_status')
    .eq('username', slug)
    .maybeSingle()

  if (!profile || profile.account_status === 'deactivated') {
    notFound()
  }

  const { data: gameSessions } = await supabase
    .from('quiz_sessions')
    .select('id, score, prize_cents_won')
    .eq('user_id', profile.id)
    .eq('status', 'completed')

  const gamesPlayed = gameSessions?.length ?? 0
  const totalScore = (gameSessions ?? []).reduce((acc, s) => acc + (s.score ?? 0), 0)
  const totalPrizeCents = (gameSessions ?? []).reduce((acc, s) => acc + (s.prize_cents_won ?? 0), 0)
  const kanbanProfileUrl = buildKanbanAppUrl(`/u/${profile.username ?? slug}`)

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem', background: '#0f172a', color: '#f8fafc' }}>
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem', fontWeight: 950 }}>{profile.full_name}</h1>
        <p style={{ margin: '0 0 1rem', color: '#818cf8', fontWeight: 700 }}>@{profile.username}</p>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
          Games played: <strong>{gamesPlayed}</strong> · Score: <strong>{totalScore}</strong> · Prizes:{' '}
          <strong>${(totalPrizeCents / 100).toFixed(2)}</strong>
        </p>
        <a
          href={kanbanProfileUrl}
          style={{
            display: 'inline-block',
            marginTop: '1.25rem',
            color: '#10b981',
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          View on Kanban →
        </a>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Back to games home
          </Link>
        </p>
      </div>
    </main>
  )
}
