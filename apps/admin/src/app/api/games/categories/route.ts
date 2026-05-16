import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { getErrorMessage } from '@/utils/errors'
import { CACHE_HEADERS, getCached } from '@/utils/server-cache'

export const dynamic = 'force-dynamic'

const CATEGORY_COLUMNS =
  'id, name, slug, description, difficulty_tier, prize_pool_cents, is_active, icon_url'

export async function GET() {
  try {
    const categories = await getCached('games:categories:active', 300_000, async () => {
      const adminDb = getAdminDb()
      if (!adminDb) return []

      const { data, error } = await adminDb
        .from('quiz_categories')
        .select(CATEGORY_COLUMNS)
        .eq('is_active', true)
        .order('prize_pool_cents', { ascending: false })
        .limit(100)

      if (error) throw error
      return data ?? []
    })

    return NextResponse.json(
      { categories },
      { headers: CACHE_HEADERS.publicMedium },
    )
  } catch (err: unknown) {
    console.error('Games Categories Error:', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
