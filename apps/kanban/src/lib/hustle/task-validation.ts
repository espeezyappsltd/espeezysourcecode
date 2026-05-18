import { z } from 'zod'
import { MAX_ASSET_CREDIT_VALUE } from '@/lib/credits'
import { centsToCredits, creditsToLegacyCents } from '@/lib/hustle/credits'

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

export const hustleTaskInputSchema = z
  .object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120),
    description: z
      .string()
      .trim()
      .min(20, 'Description must be at least 20 characters')
      .max(4000),
    category: hustleCategorySchema,
    payout_credits: z.number().int().min(1).max(MAX_ASSET_CREDIT_VALUE).optional(),
    payout_cents: z.number().int().min(100).max(500_000).optional(),
    deadline: z.string().datetime().optional().nullable(),
    connection_only: z.boolean().optional(),
    fund_now: z.boolean().optional(),
  })
  .refine((d) => (d.payout_credits ?? 0) > 0 || (d.payout_cents ?? 0) >= 100, {
    message: `Set payout between 1 and ${MAX_ASSET_CREDIT_VALUE} Espeezy credits.`,
    path: ['payout_credits'],
  })

export function normalizeHustlePayoutInput(body: {
  payout_credits?: unknown
  payout_cents?: unknown
}): { payout_credits: number; payout_cents: number } {
  let credits =
    typeof body.payout_credits === 'number'
      ? body.payout_credits
      : body.payout_credits != null
        ? Number(body.payout_credits)
        : 0
  if (!Number.isFinite(credits) || credits <= 0) {
    const cents =
      typeof body.payout_cents === 'number' ? body.payout_cents : Number(body.payout_cents ?? 0)
    credits = centsToCredits(cents)
  }
  credits = Math.min(MAX_ASSET_CREDIT_VALUE, Math.max(1, Math.floor(credits)))
  return { payout_credits: credits, payout_cents: creditsToLegacyCents(credits) }
}

export const hustleTaskRowSchema = z.object({
  id: z.string().uuid(),
  poster_id: z.string().uuid(),
  assignee_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(4000),
  category: hustleCategorySchema,
  payout_cents: z.number().int().min(0).max(500_000),
  payout_credits: z.number().int().min(0).max(MAX_ASSET_CREDIT_VALUE).optional(),
  escrow_credits: z.number().int().min(0).optional(),
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

export function formatHustleCategory(category: string | null | undefined): string {
  if (!category || typeof category !== 'string') return 'General'
  const trimmed = category.trim()
  if (!trimmed) return 'General'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).replace(/_/g, ' ')
}
