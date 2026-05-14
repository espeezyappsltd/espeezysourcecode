// Central type declarations for chat widget and related modules

export type ChatMessage = {
  id: string
  username: string
  message: string
  created_at: string
  status: string
}

export type ChatEvent = {
  id: string
  event_type: string
  username?: string
  created_at: string
}
