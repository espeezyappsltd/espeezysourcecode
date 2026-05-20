import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { buildMarketplaceDocumentHtml } from '@/lib/marketplace/document-html'
import { buildMarketplaceDocumentPdf } from '@/lib/marketplace/marketplace-pdf'
import {
  documentKindForParty,
  type MarketplaceDocumentKind,
} from '@/lib/marketplace/document-types'
import { resolveProfileDisplayName } from '@/lib/marketplace/profile-display-name'

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://kanban.espeezy.com').replace(/\/$/, '')
}

export async function buildMarketplaceDocumentResponse(
  userId: string,
  purchaseId: string,
  options?: {
    forcedKind?: MarketplaceDocumentKind
    format?: 'html' | 'pdf'
  },
) {
  const db = getAdminDb()

  const { data: purchase, error } = await db
    .from('marketplace_purchases')
    .select('*')
    .eq('id', purchaseId)
    .maybeSingle()

  if (error || !purchase) {
    return new NextResponse('Document not found', { status: 404 })
  }

  const kind =
    options?.forcedKind ?? documentKindForParty(userId, purchase.buyer_id, purchase.seller_id)

  if (!kind) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (options?.forcedKind && documentKindForParty(userId, purchase.buyer_id, purchase.seller_id) !== options.forcedKind) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, username, email, espeezy_email, espeezy_credits')
    .in('id', [purchase.buyer_id, purchase.seller_id])

  const buyerProfile = profiles?.find((p) => p.id === purchase.buyer_id)
  const sellerProfile = profiles?.find((p) => p.id === purchase.seller_id)

  const meta =
    purchase.metadata && typeof purchase.metadata === 'object'
      ? (purchase.metadata as Record<string, unknown>)
      : {}

  const buyerName =
    (purchase.buyer_display_name as string | null)?.trim() ||
    (typeof meta.buyer_display_name === 'string' ? meta.buyer_display_name : null) ||
    resolveProfileDisplayName(buyerProfile)

  const sellerName =
    (purchase.seller_display_name as string | null)?.trim() ||
    (typeof meta.seller_display_name === 'string' ? meta.seller_display_name : null) ||
    resolveProfileDisplayName(sellerProfile)

  const verifyToken =
    (purchase.verify_token as string | null)?.trim() ||
    (typeof meta.verify_token === 'string' ? meta.verify_token : '') ||
    ''

  const platformFeeCredits =
    typeof purchase.platform_fee_credits === 'number'
      ? purchase.platform_fee_credits
      : typeof meta.platform_fee_credits === 'number'
        ? meta.platform_fee_credits
        : 0

  const sellerNetCredits =
    typeof purchase.seller_net_credits === 'number'
      ? purchase.seller_net_credits
      : typeof meta.seller_net_credits === 'number'
        ? meta.seller_net_credits
        : Math.max(0, purchase.credits_amount - platformFeeCredits)

  const meetupZone =
    typeof meta.meetup_zone === 'string' ? meta.meetup_zone : null

  const origin = appOrigin()
  const docBase = kind === 'invoice' ? 'invoice' : 'receipt'
  const printUrl = `${origin}/marketplace/${docBase}/${purchaseId}`
  const downloadUrl = `${origin}/api/marketplace/documents/${purchaseId}/download?kind=${kind}`
  const verifyUrl = verifyToken
    ? `${origin}/api/marketplace/documents/${purchaseId}/verify?token=${encodeURIComponent(verifyToken)}`
    : `${origin}/api/marketplace/documents/${purchaseId}/verify`

  const documentData = {
    kind,
    invoiceNumber: purchase.invoice_number,
    purchaseId: purchase.id,
    verifyToken: verifyToken || '—',
    listingTitle: purchase.listing_title,
    listingCategory: purchase.listing_category,
    creditsAmount: purchase.credits_amount,
    platformFeeCredits,
    sellerNetCredits,
    createdAt: purchase.created_at,
    meetupZone,
    printUrl,
    downloadUrl,
    verifyUrl,
    buyer: {
      role: 'buyer' as const,
      name: buyerName,
      email: buyerProfile?.email ?? buyerProfile?.espeezy_email,
      creditsAfter:
        typeof meta.buyer_credits_after === 'number'
          ? meta.buyer_credits_after
          : (buyerProfile?.espeezy_credits ?? 0),
    },
    seller: {
      role: 'seller' as const,
      name: sellerName,
      email: sellerProfile?.email ?? sellerProfile?.espeezy_email,
      creditsAfter:
        typeof meta.seller_credits_after === 'number'
          ? meta.seller_credits_after
          : (sellerProfile?.espeezy_credits ?? 0),
    },
  }

  if (options?.format === 'pdf') {
    const pdf = buildMarketplaceDocumentPdf(documentData)
    const filename =
      kind === 'invoice'
        ? `espeezy-invoice-${purchase.invoice_number}.pdf`
        : `espeezy-receipt-${purchase.invoice_number}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const html = buildMarketplaceDocumentHtml(documentData)
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function verifyMarketplaceDocument(purchaseId: string, token: string | null) {
  const db = getAdminDb()
  const { data: purchase, error } = await db
    .from('marketplace_purchases')
    .select(
      'id, invoice_number, credits_amount, created_at, verify_token, buyer_display_name, seller_display_name, listing_title, platform_fee_credits, seller_net_credits',
    )
    .eq('id', purchaseId)
    .maybeSingle()

  if (error || !purchase) {
    return NextResponse.json({ valid: false, error: 'not_found' }, { status: 404 })
  }

  const stored = (purchase.verify_token as string | null)?.trim()
  if (!stored || !token || stored !== token.trim()) {
    return NextResponse.json({ valid: false, error: 'invalid_token' }, { status: 403 })
  }

  return NextResponse.json({
    valid: true,
    purchaseId: purchase.id,
    invoiceNumber: purchase.invoice_number,
    listingTitle: purchase.listing_title,
    creditsAmount: purchase.credits_amount,
    platformFeeCredits: purchase.platform_fee_credits ?? 0,
    sellerNetCredits: purchase.seller_net_credits ?? purchase.credits_amount,
    createdAt: purchase.created_at,
    buyerName: purchase.buyer_display_name,
    sellerName: purchase.seller_display_name,
  })
}
