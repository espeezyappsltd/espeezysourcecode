// Unused database imports removed to resolve lint warnings
import { Profile } from './auth'

export type TabName = 'identity' | 'pulse' | 'activity' | 'intercom' | 'security' | 'appearance' | 'workspace' | 'data' | 'team' | 'billing' | 'support' | 'identity_hub';

export type ActionType = 
  | 'task_created' 
  | 'task_updated' 
  | 'task_deleted' 
  | 'message_sent' 
  | 'message_deleted' 
  | 'setting_updated' 
  | 'theme_changed' 
  | 'privacy_toggled'
  | 'member_kicked'
  | 'artifact_uploaded'
  | 'payment_completed'
  | 'payment_failed';

export type LogEntry = {
  id: string;
  user_id: string;
  action_type: ActionType;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null };
};

export interface DashboardHomeProps {
  groupId: string;
  profile: Profile;
}

export interface KanbanBoardProps {
  groupId: string;
  profile: Profile;
  newTaskSignal?: number;
}

export interface SidebarProps {
  user: { id: string };
}

export type ChatPayload = {
  type: 'image' | 'file'
  url: string
  name?: string
}

export interface ChatMessage {
  id: string
  group_id: string
  user_id: string
  content: string
  created_at: string
  is_deleted: boolean
  profiles?: {
    full_name: string | null
    avatar_url: string | null
    role: string | null
  }
  payload?: ChatPayload
  pending?: boolean // For Optimistic UI
}

export type Palette = {
  name: string
  colors: {
    '--bg-main': string
    '--bg-sub': string
    '--text-main': string
    '--text-sub': string
    '--brand': string
    '--brand-hover': string
    '--accent': string
    '--border': string
    '--surface': string
    '--error': string
    '--success': string
    '--warning': string
    '--overlay': string
  }
  tier?: 'free' | 'pro' | 'premium'
}

export type ThemeContextType = {
  currentPalette: Palette
  setPalette: (name: string) => void
  customBg: string | null
  setCustomBg: (url: string | null) => void
}

export type Notification = {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
  metadata?: Record<string, unknown>
}

export type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addToast: (title: string, message: string, type?: string) => void
  refreshNotifications: () => Promise<void>
}

export type Toast = {
  id: string
  title: string
  message: string
  type: string
}

export type UserPresence = {
  user_id: string
  full_name?: string
  online_at: string
  is_typing?: boolean
  music?: {
    isPlaying: boolean
    trackUri: string
    trackName: string
    artistName: string
    progressMs: number
    timestamp: number
  }
}

export type PresenceState = {
  [key: string]: UserPresence[]
}

export type PresenceContextType = {
  onlineUsers: Set<string>
  typingUsers: Set<string>
  setTypingStatus: (isTyping: boolean) => Promise<void>
}

export type OnboardingWrapperProps = {
  profile?: { full_name?: string; avatar_url?: string } | null
  user: { id: string }
  children: React.ReactNode
}

export type MemberProfileModalProps = {
  member: import('./auth').Profile
  groupMembers: import('./auth').Profile[]
  tasks: import('./database').Task[]
  onClose: () => void
}

export type OnboardingModalProps = {
  user: { id: string }
  onComplete: () => void
}

export type TaskModalProps = {
  task: import('./database').Task | null
  groupId: string
  onClose: () => void
  onRefresh: () => Promise<void> | void
  onTaskSaved?: () => Promise<void> | void
  initialDueDate?: string
  onlineUserIds?: Set<string>
}

export type VirtualEmail = {
  id: string
  subject: string
  from: string
  content: string
  timestamp: string
  hasAttachment: boolean
  type: 'reminder' | 'report' | 'system'
}
