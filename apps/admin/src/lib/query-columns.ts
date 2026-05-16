/** Narrow PostgREST column lists — prefer over select('*') on API hot paths. */

export const Q = {
  profile: {
    card: 'id, full_name, avatar_url, username, role',
    list: 'id, full_name, avatar_url, username, role, subscription_plan, created_at',
    webhook: 'id, username, full_name, total_score, email, espeezy_email',
    groupMember: 'id, full_name, avatar_url, username, role, total_score, group_id',
    recentAdmin: 'id, full_name, email, subscription_plan, created_at, role, avatar_url',
  },
  hustleTask:
    'id, poster_id, assignee_id, title, description, category, payout_cents, status, deadline, connection_only, created_at, updated_at',
  marketplace: {
    asset:
      'id, title, description, category, asset_url, preview_url, tags, price, is_featured, user_id, created_at, updated_at',
    listing: 'id, title, description, category, price, images, owner_id, status',
  },
  personalAsset:
    'id, user_id, title, description, asset_type, asset_url, preview_url, category, metadata, size_bytes, created_at',
  agents: {
    list: 'id, name, specialisation, role, status, system_prompt, capabilities, pair_id, tasks_completed, created_at',
    task: 'id, agent_id, title, description, status, priority, result, created_at, updated_at',
  },
  platformConfig: 'key, value, is_active, updated_at, updated_by, label, description',
  serverError: 'id, message, stack, route, user_id, severity, created_at',
  marketingCampaign: 'id, name, subject, body, status, sent_count, created_at, updated_at',
  systemAnnouncement: 'id, title, body, type, target, starts_at, ends_at, created_at, created_by',
  auditLog:
    'id, actor_id, actor_email, action, resource_type, resource_id, severity, old_value, new_value, created_at',
  adminMetrics: 'total_users, active_groups, active_tasks, total_messages, pending_requests',
  p2pTransfer:
    'id, sender_id, recipient_id, amount_cents, fee_cents, net_cents, status, stripe_payment_intent_id, message, note, created_at, completed_at',
  group: 'id, name, module_code, description, status, created_at',
  task: 'id, title, status, group_id, assignees, description, due_date, created_at, updated_at, priority',
  artifact: 'id, file_url, group_id, task_id, uploaded_by, endorsements_count, created_at',
  commit: 'id, hash, message, author_id, author_email, task_id, lines_added, lines_deleted, created_at',
  activityLog: 'id, group_id, user_id, action, details, created_at',
  message: 'id, user_id, group_id, content, created_at',
  userConnection: 'id, user_id, target_id, status, created_at',
  userGameStats: 'id, user_id, xp, level, streak, updated_at',
} as const
