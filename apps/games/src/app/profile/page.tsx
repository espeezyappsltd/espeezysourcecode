import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GamesProfileClient from './GamesProfileClient'

export const dynamic = 'force-dynamic'

export default async function GamesProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, email, avatar_url, bio, subscription_plan, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/login?next=/profile')
  }

  const { data: gameSessions } = await supabase
    .from('quiz_sessions')
    .select('id, score, prize_cents_won, status')
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const gamesPlayed = gameSessions?.length ?? 0
  const totalScore = (gameSessions ?? []).reduce((acc, s) => acc + (s.score ?? 0), 0)
  const totalPrizeCents = (gameSessions ?? []).reduce((acc, s) => acc + (s.prize_cents_won ?? 0), 0)

  return (
    <GamesProfileClient
      profile={profile}
      stats={{ gamesPlayed, totalScore, totalPrizeCents }}
    />
  )
}
