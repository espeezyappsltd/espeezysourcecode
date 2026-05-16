export interface AdminPlatformMetrics {
  total_users: number | string
  active_groups: number | string
  active_tasks: number | string
  total_messages: number | string
  pending_requests?: number | string
}

export interface AdminActivityEvent {
  id: string
  actor_name?: string | null
  message?: string | null
  action?: string | null
  created_at: string
  group_name?: string | null
}

export interface AdminMetricsResponse {
  access: 'full' | 'minimal'
  metrics: AdminPlatformMetrics
  recentActivity: AdminActivityEvent[]
  error?: string
}
