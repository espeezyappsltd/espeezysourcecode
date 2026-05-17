import type { LucideIcon } from 'lucide-react'
import {
  Accessibility,
  BookOpen,
  Columns3,
  Keyboard,
  LayoutDashboard,
  MessageSquare,
  Users,
  Zap,
} from 'lucide-react'

export type QuickAction = {
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  primary?: boolean
}

export type GuideSection = {
  id: string
  title: string
  summary: string
  steps: string[]
  tips?: string[]
}

export const BOARD_PREVIEW = [
  {
    column: 'To Do',
    color: '#475569',
    cards: ['Literature review', 'Write abstract', 'Format citations'],
  },
  {
    column: 'In Progress',
    color: '#059669',
    cards: ['Data analysis', 'Methodology draft'],
  },
  {
    column: 'Done',
    color: '#10b981',
    cards: ['Project setup', 'Research brief', 'Team kickoff'],
  },
] as const

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'workspace',
    title: 'Open workspace',
    description: 'Jump into your team board, tasks, and live collaboration.',
    href: '/dashboard',
    icon: LayoutDashboard,
    primary: true,
  },
  {
    id: 'guide',
    title: 'User guide',
    description: 'Step-by-step instructions for every part of Kanban Home.',
    href: '#user-guide',
    icon: BookOpen,
  },
  {
    id: 'a11y',
    title: 'Accessibility',
    description: 'Text size, contrast, motion, and keyboard-friendly navigation.',
    href: '#accessibility',
    icon: Accessibility,
  },
  {
    id: 'login',
    title: 'Sign in',
    description: 'Use your Espeezy account across Kanban, notes, and network.',
    href: '/login?next=/dashboard',
    icon: Users,
  },
]

export const HOME_HIGHLIGHTS = [
  {
    icon: Columns3,
    title: 'Academic Kanban boards',
    description: 'Drag tasks across To Do, In Progress, In Review, and Done with a board built for coursework.',
  },
  {
    icon: Users,
    title: 'Team accountability',
    description: 'Assign owners, track contribution, and keep group projects visible for every teammate.',
  },
  {
    icon: MessageSquare,
    title: 'Live team chat',
    description: 'Discuss blockers beside the board with presence and typing indicators.',
  },
  {
    icon: Zap,
    title: 'Real-time sync',
    description: 'Updates propagate instantly so your team always shares the same source of truth.',
  },
] as const

export const USER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'welcome',
    title: 'Welcome to Kanban Home',
    summary: 'Your dashboard hub for boards, teams, and academic project delivery.',
    steps: [
      'Sign in with your Espeezy account (or create one on the login page).',
      'From this home screen, open your workspace to reach the live Kanban board.',
      'Use the accessibility toolbar (bottom-left) to adjust text size, contrast, and motion at any time.',
      'Open the full user guide from the toolbar, the Help button, or the User guide quick action card.',
    ],
    tips: ['Bookmark /dashboard for one-click access to your board after sign-in.'],
  },
  {
    id: 'workspace',
    title: 'Workspace & navigation',
    summary: 'How to reach your board and move around the app.',
    steps: [
      'Select Open workspace from the hero or quick actions to go to /dashboard.',
      'If you are not in a team yet, the workspace will prompt you to create or join a group.',
      'Once a team is linked to your profile, the board loads with your shared columns and cards.',
      'Use the header account area to confirm which email is signed in or to log out safely.',
    ],
  },
  {
    id: 'board',
    title: 'Using the Kanban board',
    summary: 'Create, move, and complete tasks on your team board.',
    steps: [
      'Columns follow To Do → In Progress → In Review → Done.',
      'Drag a card between columns to update status, or open a card to edit details.',
      'Use search on the board to filter tasks when your backlog grows.',
      'Assign teammates on each card so ownership stays clear during group work.',
    ],
    tips: ['Hold a card briefly before dragging so accidental clicks do not move tasks.'],
  },
  {
    id: 'collaboration',
    title: 'Team chat & presence',
    summary: 'Stay aligned without leaving the workspace.',
    steps: [
      'Open team chat from the workspace to discuss tasks in context.',
      'Presence indicators show who is active in your group.',
      'Typing indicators appear when teammates are composing a message.',
      'Activity is logged for accountability and project reviews.',
    ],
  },
  {
    id: 'accessibility',
    title: 'Accessibility features',
    summary: 'Built-in controls to tailor the interface to your needs.',
    steps: [
      'Text size: use A− / A+ in the accessibility toolbar (75%–150%).',
      'High contrast: toggles stronger borders and text for readability.',
      'Reduce motion: disables non-essential animations and spinning loaders.',
      'Underline links: makes every link visually distinct without relying on color alone.',
      'Skip to main content: press Tab on page load to reveal the skip link.',
    ],
    tips: ['Settings persist in your browser until you clear site data.'],
  },
  {
    id: 'keyboard',
    title: 'Keyboard shortcuts',
    summary: 'Navigate efficiently without a mouse.',
    steps: [
      'Tab / Shift+Tab: move focus across interactive controls in order.',
      'Enter or Space: activate buttons and follow links.',
      'Escape: close dialogs, the user guide panel, or accessibility menus.',
      'On the board: Tab to a task card, then Enter to open the task modal.',
    ],
  },
  {
    id: 'account',
    title: 'Account & support',
    summary: 'Sign-in, tiers, and getting help.',
    steps: [
      'Free tier: personal email sign-in with core board and team features.',
      'Premium: verify an institutional email to unlock advanced analytics and modules.',
      'Log out from the account strip whenever you use a shared computer.',
      'Contact hello@espeezy.com for access issues or data questions.',
    ],
  },
]

export const KEYBOARD_SHORTCUTS = [
  { keys: 'Tab', action: 'Move focus to the next control' },
  { keys: 'Shift + Tab', action: 'Move focus to the previous control' },
  { keys: 'Enter', action: 'Activate buttons and links' },
  { keys: 'Esc', action: 'Close guide panel or dialogs' },
] as const
