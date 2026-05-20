import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import {
  buildCreditFundReceiptHtml,
  buildCreditFundReceiptPdf,
  resolveFundReceiptProfile,
} from '@/lib/credits/fund-receipt'
import { tierSummary, CREDIT_FUND_TIERS } from '@/lib/credits/fund-tiers'

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://kanban.espeezy.com').replace(/\/$/, '')
}

export async function buildFundReceiptResponse(
  userId: string,
  stripeSessionId: string,
  format: 'html' | 'pdf' = 'html',
) {
  const db = getAdminDb()
  const { data: row, error } = await db
    .from('credit_fund_checkouts')
    .select('*')
    .eq('stripe_session_id', stripeSessionId)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .maybeSingle()

  if (error || !row) {
    return new NextResponse('Receipt not found', { status: 404 })
  }

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, username, email, espeezy_email, espeezy_credits')
    .eq('id', userId)
    .maybeSingle()

  const displayName =
    (row.user_display_name as string | null)?.trim() || resolveFundReceiptProfile(profile)
  const receiptNumber = (row.receipt_number as string) || `EZ-CF-PENDING`
  const verifyToken = (row.verify_token as string) || ''
  const tier = CREDIT_FUND_TIERS.find((t) => t.amountGbp === Number(row.amount_gbp))
  const origin = appOrigin()
  const printUrl = `${origin}/account/credits/receipt?session_id=${encodeURIComponent(stripeSessionId)}`
  const downloadUrl = `${origin}/api/credits/fund-receipt/download?session_id=${encodeURIComponent(stripeSessionId)}`
  const verifyUrl = verifyToken
    ? `${origin}/api/credits/fund-receipt/verify?session_id=${encodeURIComponent(stripeSessionId)}&token=${encodeURIComponent(verifyToken)}`
    : `${origin}/api/credits/fund-receipt/verify?session_id=${encodeURIComponent(stripeSessionId)}`

  const { data: profileAfter } = await db
    .from('profiles')
    .select('espeezy_credits')
    .eq('id', userId)
    .maybeSingle()

  const data = {
    receiptNumber,
    verifyToken: verifyToken || '—',
    userDisplayName: displayName,
    userEmail: profile?.email ?? profile?.espeezy_email,
    creditsAdded: row.credits_amount as number,
    amountGbp: Number(row.amount_gbp),
    balanceAfter: profileAfter?.espeezy_credits ?? 0,
    completedAt: (row.completed_at as string) ?? new Date().toISOString(),
    tierLabel: tier ? tierSummary(tier) : undefined,
    printUrl,
    downloadUrl,
    verifyUrl,
  }

  if (format === 'pdf') {
    const pdf = buildCreditFundReceiptPdf(data)
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="espeezy-fund-${receiptNumber}.pdf"`,
      },
    })
  }

  return new NextResponse(buildCreditFundReceiptHtml(data), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function verifyFundReceipt(stripeSessionId: string, token: string | null) {
  const db = getAdminDb()
  const { data: row, error } = await db
    .from('credit_fund_checkouts')
    .select(
      'receipt_number, credits_amount, amount_gbp, completed_at, verify_token, user_display_name, status',
    )
    .eq('stripe_session_id', stripeSessionId)
    .eq('status', 'completed')
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json({ valid: false, error: 'not_found' }, { status: 404 })
  }

  const stored = (row.verify_token as string | null)?.trim()
  if (!stored || !token || stored !== token.trim()) {
    return NextResponse.json({ valid: false, error: 'invalid_token' }, { status: 403 })
  }

  return NextResponse.json({
    valid: true,
    receiptNumber: row.receipt_number,
    creditsAdded: row.credits_amount,
    amountGbp: row.amount_gbp,
    completedAt: row.completed_at,
    userDisplayName: row.user_display_name,
  })
}
