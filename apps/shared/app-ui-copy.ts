/**
 * Shared educative UI copy for in-app help surfaces (Help tray, onboarding intros).
 */
import { espeezyDocsUrl } from './espeezy-marketing-links'

export type HelpFeatureGuide = {
  title: string
  desc: string
  link: string
  /** Custom event name — opens in-app guide instead of navigating */
  actionEvent?: string
}

export const HELP_TRAY_TITLE = 'Help and onboarding'

export const HELP_TRAY_LEAD =
  'Browse feature guides, search the Ask directory, or open the quick start documentation.'

export const HELP_TRAY_CTA_LABEL = 'Quick start guide'

export const KANBAN_HELP_GUIDES: HelpFeatureGuide[] = [
  {
    title: 'Kanban board',
    desc: 'Organize tasks, update status, assign teammates, and track project progress on a shared board.',
    link: espeezyDocsUrl('/docs/features/kanban'),
    actionEvent: 'open-kanban-onboarding',
  },
  {
    title: 'Academic roadmap',
    desc: 'Plan milestones, set deadlines, and visualize your project timeline alongside coursework.',
    link: espeezyDocsUrl('/docs/features/roadmap'),
  },
  {
    title: 'Team and chat',
    desc: 'Invite teammates, manage roles, and coordinate in real time without leaving the workspace.',
    link: espeezyDocsUrl('/docs/features/network'),
  },
  {
    title: 'Espeezy Studio',
    desc: 'Premium workspace for client projects, invoicing, and professional delivery workflows.',
    link: '/studio',
  },
  {
    title: 'Profile and settings',
    desc: 'Update your profile, notification preferences, themes, and account security settings.',
    link: '/settings',
  },
]

export const ADMIN_HELP_GUIDES: HelpFeatureGuide[] = [
  {
    title: 'Kanban board',
    desc: 'Organize tasks, update status, assign teammates, and track project progress on a shared board.',
    link: espeezyDocsUrl('/docs/features/kanban'),
  },
  {
    title: 'Academic roadmap',
    desc: 'Plan milestones, set deadlines, and visualize project timelines for academic teams.',
    link: espeezyDocsUrl('/docs/features/roadmap'),
  },
  {
    title: 'Team and chat',
    desc: 'Invite teammates, manage roles, and coordinate in real time within the workspace.',
    link: espeezyDocsUrl('/docs/features/network'),
  },
  {
    title: 'Marketplace',
    desc: 'Review peer listings and support students exchanging academic resources securely.',
    link: espeezyDocsUrl('/docs/features/marketplace'),
  },
  {
    title: 'Profile and settings',
    desc: 'Update profile details, notification preferences, and account security settings.',
    link: espeezyDocsUrl('/docs/getting-started'),
  },
]

export const GAMES_SHELL_TAGLINE =
  'Structured study sessions through interactive learning games. Sign in with your Espeezy account.'

export const ARTICLES_PAGE_INTRO =
  'Published articles and essays from the Espeezy community. Read, react, and share posts that support learning and collaboration.'

export const ARTICLES_EMPTY_STATE = 'No articles are published yet. Check back after the editorial team adds new posts.'
