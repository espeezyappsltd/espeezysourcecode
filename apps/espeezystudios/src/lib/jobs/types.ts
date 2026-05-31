export type JobDocumentKind = 'requirements' | 'prd'

export type JobDocument = {
  id: string
  job_id: string
  kind: JobDocumentKind
  storage_path: string
  filename: string
  content_type?: string | null
  size_bytes: number
  created_at?: string | null
  updated_at?: string | null
}

export type JobStatus = 'pending' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type DeliveryStatus = 'draft' | 'in_delivery' | 'delivered' | 'invoiced'

export type StudioJob = {
  id: string
  title: string
  description: string
  status: string
  client_name?: string | null
  client_email?: string | null
  budget_cents?: number | null
  currency?: string | null
  deadline_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  assigned_to?: string | null
  requirements_text?: string | null
  prd_text?: string | null
  final_report_text?: string | null
  delivery_status?: string | null
  invoice_number?: string | null
  receipt_number?: string | null
  last_delivered_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type JobMilestone = {
  id: string
  job_id: string
  title: string
  description?: string | null
  due_at?: string | null
  status: string
  sort_order: number
  completed_at?: string | null
}

export type JobBudgetEntry = {
  id: string
  job_id: string
  label: string
  amount_cents: number
  entry_type: 'estimate' | 'actual' | 'invoice' | 'expense'
  notes?: string | null
  entry_date: string
}

export type JobTimelineEvent = {
  id: string
  job_id: string
  title: string
  description?: string | null
  event_at: string
  kind: string
}

export type JobDeliveryLog = {
  id: string
  job_id: string
  sent_to: string
  invoice_number?: string | null
  receipt_number?: string | null
  delivery_status: string
  sent_at: string
}

export type JobBundle = {
  job: StudioJob
  milestones: JobMilestone[]
  budgetEntries: JobBudgetEntry[]
  timeline: JobTimelineEvent[]
  deliveryLogs: JobDeliveryLog[]
}
