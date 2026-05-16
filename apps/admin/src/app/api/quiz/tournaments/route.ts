import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

type TournamentRow = { id: string; [key: string]: unknown }

export async function GET(_req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser().catch(() => ({ data: { user: null } }))
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
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (tournaments ?? []) as TournamentRow[]
  if (rows.length === 0) return NextResponse.json({ tournaments: [] })

  const ids = rows.map((t) => t.id)

  const [countResults, { data: myEntries }] = await Promise.all([
    Promise.all(
      ids.map((id) =>
        admin
          .from('quiz_tournament_participants')
          .select('id', { count: 'exact', head: true })
          .eq('tournament_id', id),
      ),
    ),
    admin
      .from('quiz_tournament_participants')
      .select('tournament_id, rank, prize_cents_won, entry_paid')
      .eq('user_id', user.id)
      .in('tournament_id', ids),
  ])

  const myByTournament = new Map(
    (myEntries ?? []).map((e) => [e.tournament_id as string, e]),
  )

  const enriched = rows.map((t, i) => ({
    ...t,
    participant_count: countResults[i].count ?? 0,
    my_entry: myByTournament.get(t.id) ?? null,
  }))

  return NextResponse.json({ tournaments: enriched })
}
