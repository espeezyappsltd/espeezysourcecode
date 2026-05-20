import { addMarketplacePurchaseToArsenal } from '@/lib/assets/workspace-seed'
import { getAdminDb } from '@/lib/supabase/admin'
import { formatCredits } from '@/lib/credits'
import { documentPathForKind } from '@/lib/marketplace/document-types'
import { resolveProfileDisplayName } from '@/lib/marketplace/profile-display-name'
import { sendMarketplaceDocumentEmail } from '@/services/email'

export type MarketplacePurchaseResult = {
  purchaseId: string
  invoiceNumber: string
  creditsAmount: number
  platformFeeCredits: number
  sellerNetCredits: number
  buyerCredits: number
  sellerCredits: number
  sellerId: string
  listingTitle: string
}

const RPC_ERRORS: Record<string, string> = {
  listing_not_found: 'This listing is no longer available.',
  listing_unavailable: 'This item has already been sold.',
  cannot_buy_own_listing: 'You cannot purchase your own listing.',
  insufficient_credits: 'Insufficient Espeezy credits for this purchase.',
  price_exceeds_cap: 'Listing price exceeds the maximum credit value.',
  buyer_not_found: 'Buyer profile not found.',
  seller_not_found: 'Seller profile not found.',
  invalid_input: 'Invalid purchase request.',
}

function mapRpcError(message: string): string {
  for (const [code, text] of Object.entries(RPC_ERRORS)) {
    if (message.includes(code)) return text
  }
  return 'Checkout could not be completed. Please try again.'
}

async function loadPartyProfiles(buyerId: string, sellerId: string) {
  const db = getAdminDb()
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, username, email, espeezy_email')
    .in('id', [buyerId, sellerId])

  if (error) throw new Error(error.message)

  const buyer = data?.find((p) => p.id === buyerId)
  const seller = data?.find((p) => p.id === sellerId)
  return { buyer, seller }
}

async function grantBuyerInventory(
  buyerId: string,
  listingId: string,
  purchaseId: string,
  invoiceNumber?: string,
) {
  const db = getAdminDb()
  const { data: listing } = await db
    .from('marketplace_listings')
    .select(
      'id, title, description, category, price, images, owner_id, listing_type, delivery_kind, digital_url, digital_content',
    )
    .eq('id', listingId)
    .maybeSingle()

  if (!listing) return

  await addMarketplacePurchaseToArsenal(buyerId, {
    listingId: listing.id,
    purchaseId,
    invoiceNumber,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    price: listing.price,
    images: listing.images,
    ownerId: listing.owner_id,
    listingType: listing.listing_type,
    deliveryKind: listing.delivery_kind,
    digitalUrl: listing.digital_url,
    digitalContent: listing.digital_content,
  })
}

export async function completeMarketplaceCreditPurchase(
  buyerId: string,
  listingId: string,
): Promise<MarketplacePurchaseResult> {
  const db = getAdminDb()

  const { data: rpcData, error: rpcError } = await db.rpc('marketplace_credit_purchase', {
    p_listing_id: listingId,
    p_buyer_id: buyerId,
  })

  if (rpcError) {
    throw new Error(mapRpcError(rpcError.message))
  }

  const result = rpcData as {
    purchase_id: string
    invoice_number: string
    credits_amount: number
    platform_fee_credits?: number
    seller_net_credits?: number
    buyer_credits: number
    seller_credits: number
    seller_id: string
    listing_title: string
    verify_token?: string
    buyer_display_name?: string
    seller_display_name?: string
  }

  const platformFeeCredits = result.platform_fee_credits ?? 0
  const sellerNetCredits = result.seller_net_credits ?? result.credits_amount - platformFeeCredits

  const purchaseId = result.purchase_id
  const sellerId = result.seller_id
  const verifyToken = result.verify_token ?? null
  const buyerDisplayName = result.buyer_display_name ?? null
  const sellerDisplayName = result.seller_display_name ?? null

  const { buyer, seller } = await loadPartyProfiles(buyerId, sellerId)
  const resolvedBuyerName = buyerDisplayName ?? resolveProfileDisplayName(buyer)
  const resolvedSellerName = sellerDisplayName ?? resolveProfileDisplayName(seller)

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://kanban.espeezy.com').replace(/\/$/, '')
  const buyerDocPath = documentPathForKind(purchaseId, 'invoice')
  const sellerDocPath = documentPathForKind(purchaseId, 'receipt')
  const buyerPrintUrl = `${appUrl}${buyerDocPath}`
  const sellerPrintUrl = `${appUrl}${sellerDocPath}`

  const creditLabel = formatCredits(result.credits_amount)

  const { data: purchaseRow } = await db
    .from('marketplace_purchases')
    .select('metadata')
    .eq('id', purchaseId)
    .maybeSingle()

  const baseMeta =
    purchaseRow?.metadata && typeof purchaseRow.metadata === 'object'
      ? { ...(purchaseRow.metadata as Record<string, unknown>) }
      : {}

  await db
    .from('marketplace_purchases')
    .update({
      metadata: {
        ...baseMeta,
        platform_fee_credits: platformFeeCredits,
        seller_net_credits: sellerNetCredits,
        buyer_credits_after: result.buyer_credits,
        seller_credits_after: result.seller_credits,
        buyer_display_name: resolvedBuyerName,
        seller_display_name: resolvedSellerName,
        ...(verifyToken ? { verify_token: verifyToken } : {}),
      },
      ...(verifyToken ? { verify_token: verifyToken } : {}),
      buyer_display_name: resolvedBuyerName,
      seller_display_name: resolvedSellerName,
    })
    .eq('id', purchaseId)

  await db.from('notifications').insert([
    {
      user_id: buyerId,
      type: 'marketplace_purchase',
      title: 'Purchase confirmed',
      message: `You bought "${result.listing_title}" for ${creditLabel}. Balance: ${result.buyer_credits} credits.`,
      link: buyerDocPath,
      metadata: {
        purchase_id: purchaseId,
        role: 'buyer',
        credits_after: result.buyer_credits,
        document: 'invoice',
      },
    },
    {
      user_id: sellerId,
      type: 'marketplace_sale',
      title: 'Item sold',
      message:
        platformFeeCredits > 0
          ? `"${result.listing_title}" sold for ${creditLabel} (${sellerNetCredits} cr after ${platformFeeCredits} cr platform fee). Balance: ${result.seller_credits} credits.`
          : `"${result.listing_title}" sold for ${creditLabel}. Balance: ${result.seller_credits} credits.`,
      link: sellerDocPath,
      metadata: {
        purchase_id: purchaseId,
        role: 'seller',
        credits_after: result.seller_credits,
        document: 'receipt',
      },
    },
  ])

  await db.from('activity_logs').insert([
    {
      user_id: buyerId,
      group_id: null,
      app_scope: 'kanban',
      action: 'marketplace_purchase',
      resource_type: 'marketplace_listing',
      resource_id: listingId,
      details: {
        message: `Purchased "${result.listing_title}" for ${creditLabel}`,
        purchase_id: purchaseId,
        seller_id: sellerId,
      },
      status: 'success',
    },
    {
      user_id: sellerId,
      group_id: null,
      app_scope: 'kanban',
      action: 'marketplace_sale',
      resource_type: 'marketplace_listing',
      resource_id: listingId,
      details: {
        message: `Sold "${result.listing_title}" for ${creditLabel}`,
        purchase_id: purchaseId,
        buyer_id: buyerId,
      },
      status: 'success',
    },
  ])

  const buyerEmail = buyer?.email ?? buyer?.espeezy_email
  const sellerEmail = seller?.email ?? seller?.espeezy_email

  const emailJobs: Promise<void>[] = []
  if (buyerEmail) {
    emailJobs.push(
      sendMarketplaceDocumentEmail({
        to: buyerEmail,
        kind: 'invoice',
        invoiceNumber: result.invoice_number,
        listingTitle: result.listing_title,
        creditsAmount: result.credits_amount,
        creditsAfter: result.buyer_credits,
        partyName: resolvedBuyerName,
        counterpartyName: resolvedSellerName,
        printUrl: buyerPrintUrl,
        downloadUrl: `${appUrl}/api/marketplace/documents/${purchaseId}/download?kind=invoice`,
        verifyUrl: verifyToken
          ? `${appUrl}/api/marketplace/documents/${purchaseId}/verify?token=${encodeURIComponent(verifyToken)}`
          : `${appUrl}/api/marketplace/documents/${purchaseId}/verify`,
      }),
    )
  }
  if (sellerEmail) {
    emailJobs.push(
      sendMarketplaceDocumentEmail({
        to: sellerEmail,
        kind: 'receipt',
        invoiceNumber: result.invoice_number,
        listingTitle: result.listing_title,
        creditsAmount: result.credits_amount,
        platformFeeCredits,
        sellerNetCredits,
        creditsAfter: result.seller_credits,
        partyName: resolvedSellerName,
        counterpartyName: resolvedBuyerName,
        printUrl: sellerPrintUrl,
        downloadUrl: `${appUrl}/api/marketplace/documents/${purchaseId}/download?kind=receipt`,
        verifyUrl: verifyToken
          ? `${appUrl}/api/marketplace/documents/${purchaseId}/verify?token=${encodeURIComponent(verifyToken)}`
          : `${appUrl}/api/marketplace/documents/${purchaseId}/verify`,
      }),
    )
  }

  await Promise.allSettled(emailJobs)
  await grantBuyerInventory(buyerId, listingId, purchaseId, result.invoice_number).catch(() => undefined)

  return {
    purchaseId,
    invoiceNumber: result.invoice_number,
    creditsAmount: result.credits_amount,
    platformFeeCredits,
    sellerNetCredits,
    buyerCredits: result.buyer_credits,
    sellerCredits: result.seller_credits,
    sellerId,
    listingTitle: result.listing_title,
  }
}

const DEFAULT_CREDITS = 50

export async function getUserCredits(userId: string): Promise<number> {
  const db = getAdminDb()
  const { data, error } = await db
    .from('profiles')
    .select('espeezy_credits')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    if (error.message.includes('espeezy_credits')) {
      return DEFAULT_CREDITS
    }
    throw new Error(error.message)
  }
  return data?.espeezy_credits ?? DEFAULT_CREDITS
}
