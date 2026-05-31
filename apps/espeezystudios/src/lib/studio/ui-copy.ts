/** Placeholder when a field has no value in the Studio UI. */
export const STUDIO_NOT_SET = 'Not set'

/** Metric cards while counts load from Supabase. */
export const STUDIO_LOADING_METRIC = '...'

/** Page descriptions: informational (what this is) and directional (what to do). */
export const STUDIO_PAGE_COPY = {
  home: 'Your dashboard: projects, jobs, and quick actions in one place.',
  jobs: 'Create and deliver client work: timeline, budget, milestones, PRD, and invoicing.',
  jobsWorkspace: 'Track one project: timeline, budget, milestones, PRD, and client delivery.',
  marketplace:
    'List work, run gigs, and deliver to clients. Open from Kanban when you have Premium.',
  settings: 'Theme and performance. Syncs with Kanban and Games when you are signed in.',
  profile: 'Update account fields shared across Espeezy apps.',
  team: 'Manage your studio roster, roles, and project lanes.',
  analytics: 'Review charts, trends, and operational metrics for your pipeline.',
  admin: 'Staff-only tools and broadcast controls.',
} as const

export const STUDIO_STATUS = {
  profileSaved: 'Profile saved and synced with Kanban and Games.',
  jobDelivered: (invoiceNumber: string) =>
    `Delivered. Invoice ${invoiceNumber} was emailed to the client.`,
  adminTools: 'One-click access to admin tools. More panels are coming soon.',
} as const
