import {
  Activity,
  ArrowLeftRight,
  BarChart2,
  Gamepad2,
  HardDrive,
  LayoutDashboard,
  Shield,
  Users,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { PLATFORM_TEAM_SIZE } from '@shared/platform-brand'

export const PREREG_NAV = [
  { href: '#journey', label: 'Your journey' },
  { href: '#outcomes', label: 'Outcomes' },
  { href: '#live', label: "What's live" },
  { href: '#team', label: 'Platform team' },
  { href: '#register', label: 'Register' },
] as const

export type JourneyStep = {
  step: number
  title: string
  summary: string
  appSurface: string
  path: string
  icon: ReactNode
}

export const USER_JOURNEY: JourneyStep[] = [
  {
    step: 1,
    title: 'Create your account',
    summary:
      'Sign up at kanban.espeezy.com with a personal email (free tier) or verify a school email for Premium. Roles: Personal, Student, Educator, Admin.',
    appSurface: 'Sign up & onboarding',
    path: '/login',
    icon: <Shield size={20} aria-hidden />,
  },
  {
    step: 2,
    title: 'Join or create a team',
    summary:
      'Start a project team from the welcome flow, or request to join an existing team. Team leads approve join requests in chat.',
    appSurface: 'Welcome onboarding · Settings → Teams',
    path: '/settings?tab=workspace',
    icon: <Users size={20} aria-hidden />,
  },
  {
    step: 3,
    title: 'Run work on the board',
    summary:
      'Plan sprints on the Dashboard Kanban: tasks, assignees, categories, due dates, and team chat tied to your group.',
    appSurface: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={20} aria-hidden />,
  },
  {
    step: 4,
    title: 'Prove who did what',
    summary:
      'Activity logs, Project Stats, and artifacts build a verifiable picture of contribution — built for fair group assessments.',
    appSurface: 'Activity log · Project Stats',
    path: '/analytics',
    icon: <BarChart2 size={20} aria-hidden />,
  },
  {
    step: 5,
    title: 'Store work & track impact',
    summary:
      'My Assets holds your files and links. Personal Arsenal Impact Log records marketplace and Hustle ledger events with verification IDs.',
    appSurface: 'My Assets · Impact',
    path: '/assets/impact',
    icon: <HardDrive size={20} aria-hidden />,
  },
  {
    step: 6,
    title: 'Earn and trade on campus',
    summary:
      'Post or accept Hustle gigs with escrow credits. Buy and sell on Resources (marketplace) with a traceable credit trail.',
    appSurface: 'Hustle · Resources',
    path: '/hustle',
    icon: <Wallet size={20} aria-hidden />,
  },
  {
    step: 7,
    title: 'Stay in sync with people',
    summary:
      'Feed for journeys, Teammates for your roster and network, in-app notifications, and team chat on the board.',
    appSurface: 'Feed · Teammates',
    path: '/network',
    icon: <Activity size={20} aria-hidden />,
  },
  {
    step: 8,
    title: 'Switch teams in one tap',
    summary:
      'Working on multiple modules? Settings → Teams: active team, switch back to a previous team, or request a new one — boards stay saved.',
    appSurface: 'Settings → Teams',
    path: '/settings?tab=workspace',
    icon: <ArrowLeftRight size={20} aria-hidden />,
  },
  {
    step: 9,
    title: 'Recharge between sprints',
    summary:
      'Break Room quizzes, Skirmish (Espeezy Games), and Jukebox — optional spaces between serious project work.',
    appSurface: 'Break Room · Games · Jukebox',
    path: '/chillout',
    icon: <Gamepad2 size={20} aria-hidden />,
  },
]

export type VerifiableOutcome = {
  title: string
  youGet: string
  verifiedBy: string
  metric?: string
}

export const VERIFIABLE_OUTCOMES: VerifiableOutcome[] = [
  {
    title: 'Fair group projects',
    youGet: 'A shared board, assignees, and chat so work is visible to the whole team.',
    verifiedBy: 'Kanban task history · team Activity log · member roster',
    metric: 'Every status change can be traced',
  },
  {
    title: 'Contribution you can show',
    youGet: 'Analytics and artifacts that support what you actually delivered.',
    verifiedBy: 'Project Stats · linked files · activity timestamps',
    metric: 'Exportable activity history',
  },
  {
    title: 'Campus commerce with receipts',
    youGet: 'Hustle gigs and marketplace trades tied to your profile, not handshake deals.',
    verifiedBy: 'Personal Arsenal → Impact log (ledger IDs, escrow, payouts)',
    metric: 'Credits in / out summarized',
  },
  {
    title: 'Portable project memory',
    youGet: 'Secure storage for deliverables plus a paper trail across teams.',
    verifiedBy: 'My Assets vault · team switch restores archived boards',
    metric: 'One account, multiple teams',
  },
  {
    title: 'Governed team access',
    youGet: 'Join requests, roles (admin/collaborator), and visibility controls.',
    verifiedBy: 'RBAC · join-request chat intros · Settings → Teams',
    metric: 'Lead approves before access',
  },
  {
    title: 'Free core tier for students',
    youGet: 'Collaboration infrastructure without paying to participate in group work.',
    verifiedBy: 'Personal email signup · optional Premium via school verify',
    metric: 'Core features free',
  },
]

export type LiveModule = {
  name: string
  path: string
  desc: string
}

export const LIVE_MODULES: LiveModule[] = [
  { name: 'Dashboard', path: '/', desc: 'Kanban board, tasks, team chat, notifications' },
  { name: 'Feed', path: '/feed', desc: 'Academic journeys and peer updates' },
  { name: 'Hustle', path: '/hustle', desc: 'Campus gigs with escrow credits' },
  { name: 'Teammates', path: '/network', desc: 'Roster, connections, join flows' },
  { name: 'My Assets', path: '/assets', desc: 'Files, links, Personal Arsenal' },
  { name: 'Resources', path: '/marketplace', desc: 'Listings, credits checkout' },
  { name: 'Break Room', path: '/chillout', desc: 'Quizzes and rooms' },
  { name: 'Skirmish', path: '/games', desc: 'Espeezy Games (SSO)' },
  { name: 'Project Stats', path: '/analytics', desc: 'Team velocity and contribution views' },
  { name: 'Settings → Teams', path: '/settings?tab=workspace', desc: 'Switch teams, join requests, members' },
]

export const ROADMAP_ITEMS = [
  { title: 'Deeper LMS sync', desc: 'Tighter Canvas, Blackboard, and Moodle workflows (design partners today).' },
  { title: 'AI study coach', desc: 'Course-aware assistance layered on your real task context.' },
  { title: 'Wellbeing signals', desc: 'Workload-aware nudges from live board activity.' },
] as const

export const PLATFORM_TEAM_ROLES = [
  'Platform lead',
  'Backend engineering',
  'Data & infrastructure',
  'Product design',
  'Frontend engineering',
  'Campus partnerships',
  'Community & support',
  'Security & compliance',
  'Payments & billing',
  'Quality & release',
  'Growth & referrals',
  'Operations',
] as const

export function buildPlatformTeamSlots() {
  const count = Math.min(PLATFORM_TEAM_SIZE, PLATFORM_TEAM_ROLES.length)
  return Array.from({ length: count }, (_, i) => ({
    slot: i + 1,
    role: PLATFORM_TEAM_ROLES[i] ?? 'Platform operator',
  }))
}
