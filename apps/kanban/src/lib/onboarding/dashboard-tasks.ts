import type { TaskCategory } from '@/types/database'

export const ONBOARDING_MARKER_PREFIX = '[espeezy-onboarding:'
export const ONBOARDING_CREDIT_REWARD = 20

export type OnboardingTaskKey =
  | 'kanban'
  | 'feed'
  | 'hustle'
  | 'marketplace'
  | 'assets'
  | 'teammates'
  | 'settings'
  | 'plans'

export type OnboardingTaskTemplate = {
  key: OnboardingTaskKey
  title: string
  description: string
  category: TaskCategory
  path: string
  /** Short CTA on Kanban cards and task modal */
  tourButtonLabel: string
}

export type OnboardingTourAction = {
  path: string
  label: string
}

export const ONBOARDING_TASK_TEMPLATES: OnboardingTaskTemplate[] = [
  {
    key: 'kanban',
    title: 'Get started: move this card to Done',
    description: `${ONBOARDING_MARKER_PREFIX}kanban] Open the task, then change Status to Done to learn the board workflow.`,
    category: 'Documentation',
    path: '/',
    tourButtonLabel: 'On board',
  },
  {
    key: 'feed',
    title: 'Tour: Academic Journeys (Feed)',
    description: `${ONBOARDING_MARKER_PREFIX}feed] Visit Feed from the sidebar. Post or react to a journey, then mark Done.`,
    category: 'Research',
    path: '/feed',
    tourButtonLabel: 'Open Feed',
  },
  {
    key: 'hustle',
    title: 'Tour: Hustle Board',
    description: `${ONBOARDING_MARKER_PREFIX}hustle] Open Hustle, browse a campus gig, then mark this task Done.`,
    category: 'Implementation',
    path: '/hustle',
    tourButtonLabel: 'Open Hustle',
  },
  {
    key: 'marketplace',
    title: 'Tour: Campus Marketplace',
    description: `${ONBOARDING_MARKER_PREFIX}marketplace] Open Marketplace, review listings and credits checkout, then mark Done.`,
    category: 'Implementation',
    path: '/marketplace',
    tourButtonLabel: 'Marketplace',
  },
  {
    key: 'assets',
    title: 'Tour: My Assets storage',
    description: `${ONBOARDING_MARKER_PREFIX}assets] Upload a file or save a link in My Assets, then mark Done.`,
    category: 'Documentation',
    path: '/assets',
    tourButtonLabel: 'Personal',
  },
  {
    key: 'teammates',
    title: 'Tour: Teammates & network',
    description: `${ONBOARDING_MARKER_PREFIX}teammates] Open Teammates to find peers, then mark Done.`,
    category: 'Mentorship',
    path: '/network',
    tourButtonLabel: 'Teammates',
  },
  {
    key: 'settings',
    title: 'Tour: Settings & themes',
    description: `${ONBOARDING_MARKER_PREFIX}settings] Open Settings, review profile and Design tab, then mark Done.`,
    category: 'UX/UI Design',
    path: '/settings',
    tourButtonLabel: 'Settings',
  },
  {
    key: 'plans',
    title: 'Tour: Plans & Espeezy credits',
    description: `${ONBOARDING_MARKER_PREFIX}plans] Open Plans to see Pro/Premium benefits, then mark Done.`,
    category: 'Research',
    path: '/upgrade',
    tourButtonLabel: 'Plans',
  },
]

export function getOnboardingTourAction(
  description: string | null | undefined,
): OnboardingTourAction | null {
  const key = parseOnboardingKey(description)
  if (!key) return null
  const template = ONBOARDING_TASK_TEMPLATES.find((t) => t.key === key)
  if (!template || key === 'kanban') return null
  return { path: template.path, label: template.tourButtonLabel }
}

export function parseOnboardingKey(description: string | null | undefined): OnboardingTaskKey | null {
  if (!description) return null
  const match = description.match(/\[espeezy-onboarding:([a-z]+)\]/i)
  if (!match) return null
  const key = match[1] as OnboardingTaskKey
  return ONBOARDING_TASK_TEMPLATES.some((t) => t.key === key) ? key : null
}

export function isOnboardingDescription(description: string | null | undefined): boolean {
  return Boolean(description?.includes(ONBOARDING_MARKER_PREFIX))
}
