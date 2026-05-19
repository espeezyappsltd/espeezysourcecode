import { z } from 'zod'

export const feedPostBodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
  media_urls: z.array(z.string().url()).max(8).optional(),
  post_type: z.enum(['general', 'milestone', 'project', 'campus']).optional(),
  visibility: z.enum(['public', 'connections']).optional(),
  group_id: z.string().uuid().nullable().optional(),
})

export const feedPostUpdateSchema = feedPostBodySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required to update.' },
)
