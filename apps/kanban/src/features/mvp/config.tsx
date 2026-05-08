import type { ReactNode } from 'react'
import { CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import type { Column, Priority } from './types'

export type PriorityConfig = {
  label: string
  color: string
  bg: string
  icon: string
}

export type ColumnConfig = {
  title: string
  accent: string
  dimAccent: string
  emptyIcon: string
  icon: ReactNode
}

export const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  low: { label: 'Low', color: '#64748b', bg: 'rgba(100,116,139,0.15)', icon: '·' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '▲' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: '▲▲' },
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '⚡' },
}

export const COL_CONFIG: Record<Column, ColumnConfig> = {
  todo: {
    title: 'To Do',
    accent: '#6366f1',
    dimAccent: 'rgba(99,102,241,0.18)',
    emptyIcon: '📋',
    icon: <Clock size={14} />,
  },
  in_progress: {
    title: 'In Progress',
    accent: '#f59e0b',
    dimAccent: 'rgba(245,158,11,0.18)',
    emptyIcon: '⚡',
    icon: <RefreshCw size={14} />,
  },
  done: {
    title: 'Done',
    accent: '#10b981',
    dimAccent: 'rgba(16,185,129,0.18)',
    emptyIcon: '✅',
    icon: <CheckCircle2 size={14} />,
  },
}

export const COLUMN_ORDER: Column[] = ['todo', 'in_progress', 'done']
export const ROOM_ID = 'kanban-mvp'
export const MAX_USERS = 10
