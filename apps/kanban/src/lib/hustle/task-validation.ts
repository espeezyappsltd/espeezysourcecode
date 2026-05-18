import { z } from 'zod'

export const HUSTLE_CATEGORIES = [
  'design',
  'writing',
  'coding',
  'tutoring',
  'research',
  'admin',
  'marketing',
  'video',
  'photography',
  'other',
] as const

export type HustleCategory = (typeof HUSTLE_CATEGORIES)[number]

export const HUSTLE_STATUSES = [
  'open',
  'assigned',
  'in_progress',
  'submitted',
  'approved',
  'paid',
  'disputed',
  'cancelled',
] as const

const hustleCategorySchema = z.enum(HUSTLE_CATEGORIES)
const hustleStatusSchema = z.enum(HUSTLE_STATUSES)

export const hustleTaskInputSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(4000),
  category: hustleCategorySchema,
  payout_cents: z.number().int().min(100).max(500_000),
  deadline: z.string().datetime().optional().nullable(),
  connection_only: z.boolean().optional(),
})

export const hustleTaskRowSchema = z.object({
  id: z.string().uuid(),
  poster_id: z.string().uuid(),
  assignee_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(4000),
  category: hustleCategorySchema,
  payout_cents: z.number().int().min(100).max(500_000),
  status: hustleStatusSchema,
  deadline: z.string().nullable().optional(),
  connection_only: z.boolean().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})

export type HustleTaskRow = z.infer<typeof hustleTaskRowSchema>
export type HustleTaskInput = z.infer<typeof hustleTaskInputSchema>

export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function buildHustleSearchOr(query: string): string {
  const q = escapeIlikePattern(query.trim().slice(0, 80))
  if (!q) return ''
  return `title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`
}

export function validateHustleTaskRow(row: unknown): HustleTaskRow | null {
  const parsed = hustleTaskRowSchema.safeParse(row)
  return parsed.success ? parsed.data : null
}

export function formatHustleCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')
}
