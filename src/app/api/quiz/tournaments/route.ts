import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/quiz/tournaments — list active + upcoming tournaments
export async function GET(_req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  const { data: tournaments, error } = await admin
    .from('quiz_tournaments')
    .select(`
      id, slug, name, description, difficulty, prize_pool_cents, entry_fee_cents,
      max_participants, status, starts_at, ends_at, prize_distribution,
      is_seasonal, season_name,
      category:quiz_categories(id, name, slug, difficulty_tier)
    `)
    .in('status', ['upcoming', 'active'])
    .order('starts_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For each tournament, get participant count
  type TournamentRow = { id: string }
  const enriched = await Promise.all(((tournaments ?? []) as TournamentRow[]).map(async (t) => {
    const { count } = await admin
      .from('quiz_tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', t.id)

    const { data: myEntry } = await admin
      .from('quiz_tournament_participants')
      .select('rank, prize_cents_won, entry_paid')
      .eq('tournament_id', t.id)
      .eq('user_id', user.id)
      .maybeSingle()

    return { ...t, participant_count: count ?? 0, my_entry: myEntry ?? null }
  }))

  return NextResponse.json({ tournaments: enriched })
}
