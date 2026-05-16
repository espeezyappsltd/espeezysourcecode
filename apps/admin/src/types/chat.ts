export type ChatMessageRow = {
  id?: string
  room_id: string
  sender_id: string
  content: string
  metadata?: { sender_name?: string }
  created_at: string
} & Record<string, unknown>
