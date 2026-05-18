import { z } from 'zod'

export const MARKETPLACE_CATEGORIES = [
  'Electronics',
  'Textbooks',
  'Lab Equipment',
  'Stationery',
  'Hardware',
  'Other',
] as const

export type MarketplaceListingCategory = (typeof MARKETPLACE_CATEGORIES)[number]

export const LISTING_CONDITIONS = ['New', 'Like New', 'Used', 'Refurbished'] as const

export const listingRowSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  price: z.coerce.number().min(0).max(100),
  category: z.enum(MARKETPLACE_CATEGORIES),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  images: z.array(z.string()).optional(),
  meetup_zone: z.string().optional(),
  meetup_details: z.string().optional(),
  duration_days: z.number().int().positive().optional(),
  payment_method: z.string().optional(),
  status: z.string(),
  quantity: z.number().int().min(1).optional(),
  is_free: z.boolean().optional(),
  created_at: z.string(),
})

export type ValidatedListingRow = z.infer<typeof listingRowSchema>

export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function buildListingSearchOr(query: string): string {
  const q = escapeIlikePattern(query.trim().slice(0, 80))
  if (!q) return ''
  return `title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`
}

export function validateListingRow(row: unknown): ValidatedListingRow | null {
  const parsed = listingRowSchema.safeParse(row)
  if (!parsed.success) return null
  const st = parsed.data.status?.toUpperCase()
  if (st === 'REMOVED' || st === 'DELETED') return null
  return parsed.data
}
