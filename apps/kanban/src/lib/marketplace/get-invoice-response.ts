import { buildMarketplaceDocumentResponse } from '@/lib/marketplace/get-document-response'

/** @deprecated Use buildMarketplaceDocumentResponse — buyer invoice only. */
export async function buildMarketplaceInvoiceResponse(userId: string, purchaseId: string) {
  return buildMarketplaceDocumentResponse(userId, purchaseId, { forcedKind: 'invoice' })
}
