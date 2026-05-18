import { NextResponse } from 'next/server'
import { createClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** GET /api/admin/platform-treasury — platform fee balance + recent ledger (admin only) */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const isAdmin = profile?.role === 'admin' || user.email === 'kedogosospeter36@gmail.com'
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminSupabaseClient()

  const [treasuryRes, ledgerRes, settingsRes] = await Promise.all([
    admin.from('platform_treasury').select('credits_balance, updated_at').eq('id', 'main').maybeSingle(),
    admin
      .from('platform_fee_ledger')
      .select('id, source, reference_id, gross_credits, fee_credits, net_credits, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    admin.from('platform_fee_settings').select('fee_bps, min_fee_credits, min_gross_for_fee').eq('id', 'main').maybeSingle(),
  ])

  if (treasuryRes.error?.message?.includes('platform_treasury')) {
    return NextResponse.json({
      configured: false,
      message: 'Apply migration 20260519120000_platform_fees_treasury.sql',
    })
  }

  return NextResponse.json({
    configured: true,
    treasury: treasuryRes.data ?? { credits_balance: 0 },
    settings: settingsRes.data ?? { fee_bps: 200, min_fee_credits: 1, min_gross_for_fee: 2 },
    recentFees: ledgerRes.data ?? [],
  })
}
