import type { TaskCategory, TaskStatus } from '@/types/database'

export const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done']

export const CATEGORIES: TaskCategory[] = [
  'Implementation',
  'Architecture',
  'UX/UI Design',
  'Quality Assurance',
  'Research',
  'Mentorship',
  'Documentation',
  'DevOps',
  'Ethics & Legal',
]
