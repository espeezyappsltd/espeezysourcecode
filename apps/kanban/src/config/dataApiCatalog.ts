export interface DataApiDataset {
  name: string
  table: string
  filterHint: string
  notes: string
}

export const DATA_API_DATASETS: DataApiDataset[] = [
  {
    name: 'Profiles',
    table: 'profiles',
    filterHint: 'id=eq.<user_uuid>&select=id,full_name,username,group_id,role,created_at',
    notes: 'Core identity and role data for app users.',
  },
  {
    name: 'Groups',
    table: 'groups',
    filterHint: 'id=eq.<group_uuid>&select=id,name,module_code,description,created_at',
    notes: 'Team-level metadata and ownership context.',
  },
  {
    name: 'Tasks',
    table: 'tasks',
    filterHint: 'group_id=eq.<group_uuid>&select=id,title,status,assignee_id,created_at&order=created_at.desc',
    notes: 'Task lifecycle state and assignment records.',
  },
  {
    name: 'Commits',
    table: 'commits',
    filterHint: 'task_id=eq.<task_uuid>&select=hash,message,author_email,lines_added,lines_deleted,created_at',
    notes: 'Work evidence mapped to task execution.',
  },
  {
    name: 'Artifacts',
    table: 'artifacts',
    filterHint: 'task_id=eq.<task_uuid>&select=id,file_url,uploaded_by,endorsements_count,created_at',
    notes: 'Uploaded deliverables linked to tasks.',
  },
  {
    name: 'Notifications',
    table: 'notifications',
    filterHint: 'user_id=eq.<user_uuid>&select=id,type,title,message,read,created_at&order=created_at.desc',
    notes: 'In-app event feed and communication stream.',
  },
  {
    name: 'User Connections',
    table: 'user_connections',
    filterHint: 'or=(user_id.eq.<user_uuid>,target_id.eq.<user_uuid>)&select=id,user_id,target_id,status,created_at',
    notes: 'Relationship graph between students and collaborators.',
  },
  {
    name: 'Chat Messages',
    table: 'chat_messages',
    filterHint: 'group_id=eq.<group_uuid>&select=id,sender_id,content,message_type,created_at&order=created_at.asc',
    notes: 'Persistent team chat timeline.',
  },
  {
    name: 'Marketplace Listings',
    table: 'marketplace_listings',
    filterHint: 'is_active=eq.true&select=id,title,price_cents,category,status,user_id,created_at',
    notes: 'Listings powering marketplace discovery and commerce.',
  },
  {
    name: 'Payments',
    table: 'payments',
    filterHint: 'user_id=eq.<user_uuid>&select=id,amount,status,payment_type,invoice_number,created_at&order=created_at.desc',
    notes: 'Subscription, donation, and payment records.',
  },
  {
    name: 'Rewards Ledger',
    table: 'reward_ledger',
    filterHint: 'user_id=eq.<user_uuid>&select=id,type,points,cash_value_cents,description,created_at&order=created_at.desc',
    notes: 'Gamification and rewards accounting history.',
  },
  {
    name: 'Agent Tasks',
    table: 'agent_tasks',
    filterHint: 'assigned_agent_id=eq.<agent_uuid>&select=id,title,status,depends_on,created_at,completed_at',
    notes: 'Orchestration queue and execution state for agents.',
  },
  {
    name: 'Quiz Categories',
    table: 'quiz_categories',
    filterHint: 'is_active=eq.true&select=id,slug,name,difficulty_tier,prize_pool_cents',
    notes: 'Quiz taxonomy and prize allocation metadata.',
  },
  {
    name: 'Quiz Sessions',
    table: 'quiz_sessions',
    filterHint: 'user_id=eq.<user_uuid>&select=id,status,score,questions_total,prize_cents_won,started_at,completed_at',
    notes: 'Session outcomes for quiz gameplay and payouts.',
  },
]
