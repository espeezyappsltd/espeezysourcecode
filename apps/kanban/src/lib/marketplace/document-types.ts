/** Buyer-facing purchase record. */
export type MarketplaceDocumentKind = 'invoice' | 'receipt'

export function documentKindForParty(
  userId: string,
  buyerId: string,
  sellerId: string,
): MarketplaceDocumentKind | null {
  if (userId === buyerId) return 'invoice'
  if (userId === sellerId) return 'receipt'
  return null
}

export function documentPathForKind(purchaseId: string, kind: MarketplaceDocumentKind): string {
  return kind === 'invoice'
    ? `/marketplace/invoice/${purchaseId}`
    : `/marketplace/receipt/${purchaseId}`
}

export function documentTitleForKind(kind: MarketplaceDocumentKind): string {
  return kind === 'invoice' ? 'Purchase Invoice' : 'Sale Receipt'
}
