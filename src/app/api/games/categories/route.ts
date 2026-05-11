import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/games/categories  -  public categories for standalone games
export async function GET() {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ categories: [] })
    }

    const { data: categories, error } = await adminDb
      .from('quiz_categories')
      .select('*')
      .eq('is_active', true)
      .order('prize_pool_cents', { ascending: false })

    if (error) {
      console.error('Games Categories Error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (err: any) {
    console.error('Games Categories Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
