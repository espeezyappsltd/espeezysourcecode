import { z } from 'zod'

export const MARKETPLACE_CATEGORIES = [
  'Electronics',
  'Textbooks',
  'Lab Equipment',
  'Stationery',
  'Hardware',
  'Tutorials',
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
  listing_type: z.enum(['physical', 'digital']).optional(),
  delivery_kind: z.enum(['meetup', 'file', 'link']).optional(),
  digital_url: z.string().nullable().optional(),
  digital_content: z.string().nullable().optional(),
  quantity_available: z.number().int().min(0).nullable().optional(),
  purchase_count: z.number().int().min(0).optional(),
  view_count: z.number().int().min(0).optional(),
  engagement_score: z.number().optional(),
  is_platform_seed: z.boolean().optional(),
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

export const createListingInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  price: z.coerce.number().min(0).max(100),
  category: z.enum(MARKETPLACE_CATEGORIES),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  condition: z.enum(LISTING_CONDITIONS).default('Used'),
  meetup_zone: z.string().trim().min(1).max(80).default('Library'),
  meetup_details: z.string().trim().max(500).optional().default(''),
  duration_days: z.coerce.number().int().min(1).max(90).default(14),
})

export function validateListingRow(row: unknown): ValidatedListingRow | null {
  const parsed = listingRowSchema.safeParse(row)
  if (!parsed.success) return null
  const st = parsed.data.status?.toUpperCase()
  if (st === 'REMOVED' || st === 'DELETED') return null
  return parsed.data
}
