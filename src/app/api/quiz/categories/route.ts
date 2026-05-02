import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/quiz/categories — list active quiz categories with prize info
export async function GET(_req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  const { data: categories, error } = await admin
    .from('quiz_categories')
    .select('id, slug, name, description, icon, difficulty_tier, prize_pool_cents, is_seasonal, season_start, season_end')
    .eq('is_active', true)
    .order('prize_pool_cents', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ categories: categories ?? [] })
}
