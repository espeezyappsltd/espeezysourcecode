import type { Listing, MarketplaceCategory } from '@/types/marketplace'

export type TrendingSeller = {
  ownerId: string
  name: string
  avatarUrl?: string | null
  listingCount: number
  sampleListing: Listing
}

export type TrendingCategory = {
  category: MarketplaceCategory
  count: number
}

export function isListingAvailable(listing: Listing): boolean {
  const status = (listing.status ?? 'ACTIVE').toUpperCase()
  return status === 'ACTIVE' || status === 'AVAILABLE'
}

export function computeMarketplaceTrending(listings: Listing[]) {
  const available = listings.filter(isListingAvailable)

  const trendingItems = [...available]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  const sellerMap = new Map<string, TrendingSeller>()
  for (const listing of available) {
    const existing = sellerMap.get(listing.owner_id)
    if (!existing) {
      sellerMap.set(listing.owner_id, {
        ownerId: listing.owner_id,
        name: listing.profiles?.full_name ?? 'Seller',
        avatarUrl: listing.profiles?.avatar_url,
        listingCount: 1,
        sampleListing: listing,
      })
    } else {
      existing.listingCount += 1
    }
  }

  const trendingSellers = [...sellerMap.values()]
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, 5)

  const categoryCounts = new Map<string, number>()
  for (const listing of available) {
    const cat = listing.category || 'Other'
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
  }

  const trendingCategories: TrendingCategory[] = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category: category as MarketplaceCategory, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { trendingItems, trendingSellers, trendingCategories }
}
