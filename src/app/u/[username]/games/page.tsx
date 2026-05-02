import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function UserGamesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const svc = await createAdminClient()

  const { data: profile } = await svc
    .from('profiles')
    .select('id, full_name, username, account_status')
    .eq('username', username)
    .single()

  if (!profile || profile.account_status === 'deactivated') notFound()

  const { data: sessions } = await svc
    .from('quiz_sessions')
    .select('id, score, correct_answers, questions_total, prize_cents_won, play_mode, started_at, completed_at, category:quiz_categories(name, slug)')
    .eq('user_id', profile.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(50)

  const totalScore = (sessions ?? []).reduce((a: number, s: typeof sessions[0]) => a + (s.score ?? 0), 0)
  const totalPrize = (sessions ?? []).reduce((a: number, s: typeof sessions[0]) => a + (s.prize_cents_won ?? 0), 0)

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem,4vw,2.2rem)', letterSpacing: '-0.03em' }}>@{profile.username} - Games Stats</h1>
      <p style={{ color: 'var(--text-sub)' }}>{profile.full_name}</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '0.8rem', background: 'var(--surface)' }}>
          <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>Sessions</p>
          <p style={{ margin: '0.3rem 0 0', fontWeight: 900, fontSize: '1.2rem' }}>{sessions?.length ?? 0}</p>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '0.8rem', background: 'var(--surface)' }}>
          <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>Total Score</p>
          <p style={{ margin: '0.3rem 0 0', fontWeight: 900, fontSize: '1.2rem' }}>{totalScore}</p>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '0.8rem', background: 'var(--surface)' }}>
          <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>Cash Prizes</p>
          <p style={{ margin: '0.3rem 0 0', fontWeight: 900, fontSize: '1.2rem' }}>${(totalPrize / 100).toFixed(2)}</p>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '0.7rem' }}>
        {(sessions ?? []).map((s: NonNullable<typeof sessions>[number]) => (
          <article key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: '0.85rem 1rem' }}>
            <p style={{ margin: 0, fontWeight: 800 }}>{(s.category as { name?: string })?.name ?? 'Category'}</p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-sub)', fontSize: '0.84rem' }}>
              Score: {s.score} | Correct: {s.correct_answers}/{s.questions_total} | Prize: ${(s.prize_cents_won / 100).toFixed(2)} | Mode: {s.play_mode}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
