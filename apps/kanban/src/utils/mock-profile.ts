import type { Profile } from '@/types/auth'

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'

export function isMockUserId(id: string): boolean {
  return id === MOCK_USER_ID
}

export function createMockProfile(userId: string = MOCK_USER_ID): Profile {
  return {
    id: userId,
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    course_name: null,
    enrollment_year: null,
    completion_year: null,
    role: null,
    rank: null,
    badges_count: null,
    school_id: null,
    group_id: null,
    subscription_plan: 'pro',
    total_score: 0,
    created_at: new Date().toISOString(),
    theme_config: { palette: 'Google Light' },
  }
}
