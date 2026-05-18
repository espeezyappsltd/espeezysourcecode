import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminDb()

  const [profileRes, purchasesRes, salesRes] = await Promise.all([
    db.from('profiles').select('espeezy_credits, full_name').eq('id', user.id).maybeSingle(),
    db
      .from('marketplace_purchases')
      .select(
        'id, invoice_number, listing_title, listing_category, credits_amount, created_at, seller_id, buyer_id',
      )
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    db
      .from('marketplace_purchases')
      .select(
        'id, invoice_number, listing_title, listing_category, credits_amount, created_at, seller_id, buyer_id',
      )
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  if (profileRes.error?.message?.includes('espeezy_credits')) {
    return NextResponse.json({
      credits: 50,
      purchases: [],
      sales: [],
      migrationRequired: true,
    })
  }

  if (purchasesRes.error?.message?.includes('marketplace_purchases')) {
    return NextResponse.json({
      credits: profileRes.data?.espeezy_credits ?? 50,
      purchases: [],
      sales: [],
      migrationRequired: true,
    })
  }

  return NextResponse.json({
    credits: profileRes.data?.espeezy_credits ?? 0,
    purchases: purchasesRes.data ?? [],
    sales: salesRes.data ?? [],
  })
}
