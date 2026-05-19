import type { Listing } from '@/types/marketplace'

export type ListingType = 'physical' | 'digital'
export type DeliveryKind = 'meetup' | 'file' | 'link'

export function listingTypeOf(listing: Partial<Pick<Listing, 'listing_type'>>): ListingType {
  return listing.listing_type === 'digital' ? 'digital' : 'physical'
}

export function deliveryKindOf(listing: Partial<Pick<Listing, 'delivery_kind'>>): DeliveryKind {
  const k = listing.delivery_kind
  if (k === 'file' || k === 'link') return k
  return 'meetup'
}

export function quantityRemaining(
  listing: Partial<Pick<Listing, 'quantity_available' | 'quantity' | 'listing_type' | 'status'>>,
): number {
  if (typeof listing.quantity_available === 'number') return Math.max(0, listing.quantity_available)
  const st = (listing.status ?? '').toUpperCase()
  if (st === 'SOLD') return 0
  if (listingTypeOf(listing) === 'physical') return 1
  return Math.max(0, listing.quantity ?? 1)
}

export function isListingAvailable(listing: Listing): boolean {
  const status = (listing.status ?? 'ACTIVE').toUpperCase()
  if (status === 'SOLD' || status === 'UNAVAILABLE' || status === 'REMOVED') return false
  return quantityRemaining(listing) > 0
}

export function isDigitalDownloadable(
  listing: Partial<Pick<Listing, 'listing_type' | 'delivery_kind' | 'digital_url' | 'digital_content'>>,
): boolean {
  if (listingTypeOf(listing) !== 'digital') return false
  const kind = deliveryKindOf(listing)
  if (kind === 'link') return Boolean(listing.digital_url?.trim())
  if (kind === 'file') {
    return Boolean(listing.digital_content?.trim()) || Boolean(listing.digital_url?.trim())
  }
  return false
}

export function saleRuleLabel(
  listing: Partial<Pick<Listing, 'listing_type' | 'delivery_kind' | 'quantity' | 'quantity_available' | 'status'>>,
): string {
  if (listingTypeOf(listing) === 'physical') {
    return 'Physical · one buyer only (campus meetup)'
  }
  const left = quantityRemaining(listing)
  const kind = deliveryKindOf(listing)
  if (kind === 'link') return `Digital link · up to ${left} claim${left === 1 ? '' : 's'} left`
  if (kind === 'file') return `Downloadable · up to ${left} download${left === 1 ? '' : 's'} left`
  return `Digital · ${left} remaining`
}

export function maxQuantityForListingType(listingType: ListingType): number {
  return listingType === 'physical' ? 1 : 99
}
