import type { LayoutUser } from '@/types/ui'

type AuthLikeUser = {
  id: string
  user_metadata?: { full_name?: string }
  email?: string
}

export function toLayoutUser(user: AuthLikeUser): LayoutUser {
  return {
    id: user.id,
    full_name: user.user_metadata?.full_name,
    user_metadata: user.user_metadata,
  }
}
