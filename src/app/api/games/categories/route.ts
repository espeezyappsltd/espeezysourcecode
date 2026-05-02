import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

// GET /api/games/categories — public categories for standalone games
export async function GET() {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ categories: [] })
    }

    const categoriesSnap = await adminDb.collection('quiz_categories')
      .where('is_active', '==', true)
      .orderBy('prize_pool_cents', 'desc')
      .get()

    const categories = categoriesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ categories })
  } catch (err: any) {
    console.error('Games Categories Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
