export type BuyerCheckoutPreflight = {
  listingId: string
  title: string
  priceCredits: number
  platformFeeCredits: number
  sellerNetCredits: number
  assetCreditValue: number
  creditTierLabel: string
  sellerId: string
  available: boolean
  buyerCredits: number
  canAfford: boolean
  shortfall: number
  topUpPackCredits: number | null
  topUpPaymentUrl: string | null
  paymentLinkLabel?: string
  recommendedFundTier?: {
    id: string
    label: string
    amountGbp: number
    credits: number
  } | null
}
