import { z } from 'zod'

// TASK VALIDATION SCHEMA
export const taskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(1000).nullable(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']),
  category: z.enum(['design', 'frontend', 'backend', 'research', 'other']),
  assignees: z.array(z.string().uuid()),
  group_id: z.string().uuid(),
  due_date: z.string().nullable(),
})

// MARKETPLACE LISTING SCHEMA
export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(80),
  description: z.string().min(20, "Provide a more detailed description").max(2000),
  price: z.number().min(0),
  category: z.string(),
  quantity: z.number().int().min(1).default(1),
  condition: z.enum(['New', 'Like New', 'Used', 'Refurbished']),
  images: z.array(z.string()).min(1, "At least one image is required"),
  location: z.string().min(3, "Specify a pickup zone or department"),
  contact_info: z.string().optional(),
})

// PROFILE SCHEMA
export const profileSchema = z.object({
  full_name: z.string().min(2).max(50),
  tagline: z.string().max(100).optional().nullable(),
  biography: z.string().max(500).optional().nullable(),
  course_name: z.string().max(100).optional().nullable(),
  profile_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().nullable(),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().nullable(),
  country_code: z.string().length(2).optional().nullable(),
})

export type TaskInput = z.infer<typeof taskSchema>
export type ListingInput = z.infer<typeof listingSchema>
export type ProfileInput = z.infer<typeof profileSchema>
