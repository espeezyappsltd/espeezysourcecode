export type Column = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type SocketStatus = 'connecting' | 'open' | 'closed'

export type Card = {
  id: string
  title: string
  column: Column
  updatedBy: string
  updatedAt: number
  createdBy?: string
  priority?: Priority
}

export type AnalyticsEvent = {
  at: number
  userId: string
  email: string
  action: 'card_created' | 'card_moved' | 'user_joined'
  cardId?: string
  toColumn?: Column
}

export type PresenceUser = {
  userId: string
  email: string
}

export type AnalyticsSummary = {
  userId: string
  email: string
  created: number
  moved: number
  total: number
}

export type WsMessage =
  | { type: 'join'; roomId: string; userId: string; email: string }
  | { type: 'sync_state'; cards: Card[]; events: AnalyticsEvent[] }
  | { type: 'presence'; count: number; users?: PresenceUser[] }
  | { type: 'card_created'; card: Card; actor: PresenceUser }
  | { type: 'card_moved'; cardId: string; column: Column; actor: PresenceUser; at: number }
  | { type: 'error'; code: string; message: string }
