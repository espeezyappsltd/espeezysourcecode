import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { buildMarketplaceInvoiceHtml } from '@/lib/marketplace/invoice-html'

export async function buildMarketplaceInvoiceResponse(userId: string, purchaseId: string) {
  const db = getAdminDb()

  const { data: purchase, error } = await db
    .from('marketplace_purchases')
    .select('*')
    .eq('id', purchaseId)
    .maybeSingle()

  if (error || !purchase) {
    return new NextResponse('Invoice not found', { status: 404 })
  }

  if (purchase.buyer_id !== userId && purchase.seller_id !== userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, email, espeezy_email, espeezy_credits')
    .in('id', [purchase.buyer_id, purchase.seller_id])

  const buyer = profiles?.find((p) => p.id === purchase.buyer_id)
  const seller = profiles?.find((p) => p.id === purchase.seller_id)

  const meta =
    purchase.metadata && typeof purchase.metadata === 'object'
      ? (purchase.metadata as Record<string, unknown>)
      : {}

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://kanban.espeezy.com').replace(/\/$/, '')
  const printUrl = `${appUrl}/marketplace/invoice/${purchaseId}`

  const meetupZone =
    purchase.metadata && typeof purchase.metadata === 'object'
      ? String((purchase.metadata as { meetup_zone?: string }).meetup_zone ?? '')
      : null

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

  const html = buildMarketplaceInvoiceHtml({
    invoiceNumber: purchase.invoice_number,
    purchaseId: purchase.id,
    listingTitle: purchase.listing_title,
    listingCategory: purchase.listing_category,
    creditsAmount: purchase.credits_amount,
    platformFeeCredits,
    sellerNetCredits,
    createdAt: purchase.created_at,
    meetupZone,
    printUrl,
    buyer: {
      role: 'buyer',
      name: buyer?.full_name ?? 'Buyer',
      email: buyer?.email ?? buyer?.espeezy_email,
      creditsAfter:
        typeof meta.buyer_credits_after === 'number'
          ? meta.buyer_credits_after
          : (buyer?.espeezy_credits ?? 0),
    },
    seller: {
      role: 'seller',
      name: seller?.full_name ?? 'Seller',
      email: seller?.email ?? seller?.espeezy_email,
      creditsAfter:
        typeof meta.seller_credits_after === 'number'
          ? meta.seller_credits_after
          : (seller?.espeezy_credits ?? 0),
    },
  })

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
