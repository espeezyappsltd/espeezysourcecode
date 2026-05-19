export type CreateCreditFundCheckoutOpts = {
  userId: string
  email?: string
  amountGbp: number
  returnPath?: string
  listingId?: string
  contextLabel?: string
}

export type CreditFundCheckoutResult = {
  sessionId: string
  checkoutUrl: string
  amountGbp: number
  creditsAmount: number
}
