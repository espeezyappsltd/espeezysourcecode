import type { TaskCategory } from '@/types/database'

export const ONBOARDING_MARKER_PREFIX = '[espeezy-onboarding:'
export const ONBOARDING_CREDIT_REWARD = 20

export type OnboardingTaskKey =
  | 'kanban'
  | 'feed'
  | 'studio'
  | 'assets'
  | 'teammates'
  | 'settings'

export type OnboardingTaskTemplate = {
  key: OnboardingTaskKey
  title: string
  description: string
  category: TaskCategory
  path: string
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
    key: 'studio',
    title: 'Tour: Espeezy Studio (Premium)',
    description: `${ONBOARDING_MARKER_PREFIX}studio] Open Espeezy Studio from the sidebar. Marketplace & jobs live there for Premium members.`,
    category: 'Implementation',
    path: '/studio',
    tourButtonLabel: 'Espeezy Studio',
  },
  {
    key: 'assets',
    title: 'Tour: My Files storage',
    description: `${ONBOARDING_MARKER_PREFIX}assets] Upload a file or save a link in My Files, then mark Done.`,
    category: 'Documentation',
    path: '/assets/storage',
    tourButtonLabel: 'My Files',
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
