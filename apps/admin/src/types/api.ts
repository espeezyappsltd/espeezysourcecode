import type { Profile } from './database'

export interface P2pTransferRow {
  id: string
  sender_id: string
  recipient_id: string
  amount_cents: number
  status: string
  created_at: string
  updated_at?: string
}

export interface PaymentRow {
  id: string
  user_id: string
  amount_total: number
  status: string
  updated_at: string
  created_at?: string
}

export interface P2pTransferWithProfiles extends P2pTransferRow {
  type: 'p2p'
  sender: Profile | null
  recipient: Profile | null
}

export interface PaymentHistoryItem extends PaymentRow {
  type: 'upgrade'
  amount_cents: number
}

export type CombinedPaymentHistoryItem = P2pTransferWithProfiles | PaymentHistoryItem

export interface HustleTaskRow {
  id: string
  title: string
  description?: string | null
  poster_id: string
  assignee_id?: string | null
  status: string
  created_at: string
}

export interface RealtimePostgresPayload<T extends Record<string, unknown> = Record<string, unknown>> {
  new: T
  old?: T
  eventType?: string
}
