import { getAdminDb } from '@/lib/supabase/admin'
import { readCreditValueFromMetadata, creditsToGbpEquivalent, clampCreditValue } from '@/lib/credits'
import { isPayPalConfigured } from '@/lib/paypal/config'

export type MarketplacePurchaseRow = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  credits_amount: number
  platform_fee_credits?: number
  seller_net_credits?: number
  invoice_number: string
  listing_title: string
  listing_category: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type MarketplaceWithdrawalRow = {
  id: string
  credits_amount: number
  amount_cents: number
  stripe_transfer_id: string | null
  payout_method?: string | null
  paypal_payout_batch_id?: string | null
  status: string
  created_at: string
}

export type PayoutAccounts = {
  stripeConnected: boolean
  paypalLinked: boolean
  paypalEmail: string | null
  preferredPayoutMethod: 'stripe' | 'paypal'
  paypalPayoutsConfigured: boolean
}

export type AssetPerformanceRow = {
  assetId: string
  assetTitle: string
  creditValue: number
  timesSold: number
  withdrawableCredits: number
  lastSoldAt: string | null
}

export type TradingActivityRow = {
  id: string
  kind: 'sale' | 'purchase' | 'withdrawal'
  title: string
  subtitle: string
  credits: number
  gbpApprox: number
  createdAt: string
  invoiceUrl?: string
  direction: 'in' | 'out'
}

export type TradingMetrics = {
  creditsBalance: number
  totalSalesCount: number
  totalPurchasesCount: number
  grossSalesCredits: number
  grossPurchaseCredits: number
  totalWithdrawableCredits: number
  totalWithdrawnCredits: number
  availableWithdrawCredits: number
  availableWithdrawGbp: number
  assetPerformance: AssetPerformanceRow[]
  activity: TradingActivityRow[]
  purchases: MarketplacePurchaseRow[]
  sales: MarketplacePurchaseRow[]
  withdrawals: MarketplaceWithdrawalRow[]
  payoutAccounts: PayoutAccounts
}

type PersonalAssetRow = {
  id: string
  title: string
  metadata: Record<string, unknown> | null
}

function readMetaString(meta: Record<string, unknown> | null, key: string): string | null {
  if (!meta) return null
  const v = meta[key]
  return typeof v === 'string' && v.length > 0 ? v : null
}

function readSellerNetFromPurchase(purchase: MarketplacePurchaseRow): number {
  if (typeof purchase.seller_net_credits === 'number' && purchase.seller_net_credits >= 0) {
    return purchase.seller_net_credits
  }
  const meta = purchase.metadata
  const snap = meta?.seller_net_credits
  if (typeof snap === 'number' && snap >= 0) return snap
  const fee =
    typeof purchase.platform_fee_credits === 'number'
      ? purchase.platform_fee_credits
      : typeof meta?.platform_fee_credits === 'number'
        ? meta.platform_fee_credits
        : 0
  return Math.max(0, purchase.credits_amount - fee)
}

function readAssetCreditFromPurchase(
  purchase: MarketplacePurchaseRow,
  assetByListing: Map<string, PersonalAssetRow>,
): number {
  const meta = purchase.metadata
  const snap = meta?.asset_credit_value
  if (typeof snap === 'number' && snap >= 0) return clampCreditValue(snap)
  if (typeof snap === 'string' && snap.trim() !== '') {
    const n = Number(snap)
    if (Number.isFinite(n) && n >= 0) return clampCreditValue(n)
  }

  const sourceId = readMetaString(meta, 'source_personal_asset_id')
  if (sourceId) {
    for (const asset of assetByListing.values()) {
      if (asset.id === sourceId) return readCreditValueFromMetadata(asset.metadata)
    }
  }

  const linked = assetByListing.get(purchase.listing_id)
  if (linked) return readCreditValueFromMetadata(linked.metadata)

  return clampCreditValue(purchase.credits_amount)
}

function buildAssetListingMap(assets: PersonalAssetRow[]): Map<string, PersonalAssetRow> {
  const map = new Map<string, PersonalAssetRow>()
  for (const asset of assets) {
    const meta = asset.metadata
    const current = readMetaString(meta, 'marketplace_listing_id')
    if (current) map.set(current, asset)

    const history = meta?.listing_ids
    if (Array.isArray(history)) {
      for (const id of history) {
        if (typeof id === 'string' && id.length > 0) map.set(id, asset)
      }
    }
  }
  return map
}

export async function getTradingMetricsForUser(userId: string): Promise<TradingMetrics> {
  const db = getAdminDb()

  const [profileRes, purchasesRes, salesRes, withdrawalsRes, assetsRes] = await Promise.all([
    db
      .from('profiles')
      .select(
        'espeezy_credits, stripe_account_id, paypal_email, paypal_account_status, preferred_payout_method',
      )
      .eq('id', userId)
      .maybeSingle(),
    db
      .from('marketplace_purchases')
      .select(
        'id, listing_id, buyer_id, seller_id, credits_amount, platform_fee_credits, seller_net_credits, invoice_number, listing_title, listing_category, metadata, created_at',
      )
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('marketplace_purchases')
      .select(
        'id, listing_id, buyer_id, seller_id, credits_amount, platform_fee_credits, seller_net_credits, invoice_number, listing_title, listing_category, metadata, created_at',
      )
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('marketplace_withdrawals')
      .select(
        'id, credits_amount, amount_cents, stripe_transfer_id, payout_method, paypal_payout_batch_id, status, created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('personal_assets').select('id, title, metadata').eq('user_id', userId),
  ])

  const purchases = (purchasesRes.data ?? []) as MarketplacePurchaseRow[]
  const sales = (salesRes.data ?? []) as MarketplacePurchaseRow[]
  const withdrawals = (withdrawalsRes.error?.message?.includes('marketplace_withdrawals')
    ? []
    : (withdrawalsRes.data ?? [])) as MarketplaceWithdrawalRow[]
  const assets = (assetsRes.data ?? []) as PersonalAssetRow[]

  const assetByListing = buildAssetListingMap(assets)
  const performanceMap = new Map<string, AssetPerformanceRow>()

  let totalWithdrawableCredits = 0
  let grossSalesCredits = 0

  for (const sale of sales) {
    const assetCredit = readAssetCreditFromPurchase(sale, assetByListing)
    const sourceId =
      readMetaString(sale.metadata, 'source_personal_asset_id') ??
      assetByListing.get(sale.listing_id)?.id ??
      `listing:${sale.listing_id}`

    grossSalesCredits += sale.credits_amount
    totalWithdrawableCredits += assetCredit

    const existing = performanceMap.get(sourceId)
    if (existing) {
      existing.timesSold += 1
      existing.withdrawableCredits += assetCredit
      if (!existing.lastSoldAt || sale.created_at > existing.lastSoldAt) {
        existing.lastSoldAt = sale.created_at
      }
    } else {
      const asset = assets.find((a) => a.id === sourceId)
      performanceMap.set(sourceId, {
        assetId: asset?.id ?? sourceId,
        assetTitle: asset?.title ?? sale.listing_title,
        creditValue: asset ? readCreditValueFromMetadata(asset.metadata) : assetCredit,
        timesSold: 1,
        withdrawableCredits: assetCredit,
        lastSoldAt: sale.created_at,
      })
    }
  }

  const totalWithdrawnCredits = withdrawals.reduce((sum, w) => sum + w.credits_amount, 0)
  const availableWithdrawCredits = Math.max(0, totalWithdrawableCredits - totalWithdrawnCredits)
  const creditsBalance = profileRes.data?.espeezy_credits ?? 0
  const grossPurchaseCredits = purchases.reduce((sum, p) => sum + p.credits_amount, 0)

  const activity: TradingActivityRow[] = [
    ...sales.map((row) => ({
      id: row.id,
      kind: 'sale' as const,
      title: row.listing_title,
      subtitle: row.invoice_number,
      credits: readSellerNetFromPurchase(row),
      gbpApprox: creditsToGbpEquivalent(readSellerNetFromPurchase(row)),
      createdAt: row.created_at,
      invoiceUrl: `/marketplace/invoice/${row.id}`,
      direction: 'in' as const,
    })),
    ...purchases.map((row) => ({
      id: row.id,
      kind: 'purchase' as const,
      title: row.listing_title,
      subtitle: row.invoice_number,
      credits: row.credits_amount,
      gbpApprox: creditsToGbpEquivalent(row.credits_amount),
      createdAt: row.created_at,
      invoiceUrl: `/marketplace/invoice/${row.id}`,
      direction: 'out' as const,
    })),
    ...withdrawals.map((row) => ({
      id: row.id,
      kind: 'withdrawal' as const,
      title: 'Cash withdrawal',
      subtitle:
        row.payout_method === 'paypal'
          ? row.paypal_payout_batch_id
            ? `PayPal ${row.paypal_payout_batch_id.slice(0, 12)}…`
            : 'PayPal payout'
          : row.stripe_transfer_id
            ? `Stripe ${row.stripe_transfer_id.slice(0, 12)}…`
            : 'Bank transfer',
      credits: row.credits_amount,
      gbpApprox: row.amount_cents / 100,
      createdAt: row.created_at,
      direction: 'out' as const,
    })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const profile = profileRes.data as {
    espeezy_credits?: number
    stripe_account_id?: string | null
    paypal_email?: string | null
    paypal_account_status?: string | null
    preferred_payout_method?: string | null
  } | null

  const paypalLinked =
    profile?.paypal_account_status === 'linked' && Boolean(profile?.paypal_email)
  const preferredRaw = profile?.preferred_payout_method
  const preferredPayoutMethod: 'stripe' | 'paypal' =
    preferredRaw === 'paypal' ? 'paypal' : 'stripe'

  return {
    creditsBalance,
    totalSalesCount: sales.length,
    totalPurchasesCount: purchases.length,
    grossSalesCredits,
    grossPurchaseCredits,
    totalWithdrawableCredits,
    totalWithdrawnCredits,
    availableWithdrawCredits: Math.min(availableWithdrawCredits, creditsBalance),
    availableWithdrawGbp: creditsToGbpEquivalent(Math.min(availableWithdrawCredits, creditsBalance)),
    assetPerformance: Array.from(performanceMap.values()).sort(
      (a, b) => b.withdrawableCredits - a.withdrawableCredits,
    ),
    activity: activity.slice(0, 40),
    purchases,
    sales,
    withdrawals,
    payoutAccounts: {
      stripeConnected: Boolean(profile?.stripe_account_id),
      paypalLinked,
      paypalEmail: paypalLinked ? (profile?.paypal_email ?? null) : null,
      preferredPayoutMethod,
      paypalPayoutsConfigured: isPayPalConfigured(),
    },
  }
}

export function creditsToWithdrawCents(credits: number): number {
  return Math.max(0, Math.round(creditsToGbpEquivalent(credits) * 100))
}
