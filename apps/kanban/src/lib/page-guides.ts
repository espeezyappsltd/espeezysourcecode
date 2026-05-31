export type PageGuideStep = {
  title: string
  body: string
}

export type PageGuideTheme = 'journeys' | 'marketplace' | 'hustle' | 'default'

export type PageGuideConfig = {
  id: string
  pageTitle: string
  summary: string
  steps: PageGuideStep[]
  actions?: { label: string; hint: string }[]
  /** Visual theme for the floating guide (IG / TikTok style accents) */
  theme?: PageGuideTheme
  emoji?: string
}

const GUIDES: Record<string, PageGuideConfig> = {
  '/feed': {
    id: 'feed',
    pageTitle: 'Academic journeys',
    theme: 'journeys',
    emoji: '✨',
    summary: 'Share milestones and engage with peers in your learning community.',
    steps: [
      { title: 'Compose', body: 'Publish updates with public or connections-only visibility.' },
      { title: 'Engage', body: 'React and comment to support classmates on their academic progress.' },
      { title: 'Stories', body: 'Active members appear at the top when they share recent posts.' },
    ],
    actions: [
      { label: 'Post', hint: 'Share a milestone' },
      { label: 'React', hint: 'Support your peers' },
    ],
  },
  '/studio': {
    id: 'studio',
    pageTitle: 'Espeezy Studio',
    theme: 'default',
    emoji: '🏢',
    summary: 'Premium access for client projects, invoicing, and professional delivery workflows.',
    steps: [
      { title: 'Premium access', body: 'Upgrade to Premium Scholar in Kanban to unlock Studio.' },
      { title: 'Single sign-on', body: 'Open studios.espeezy.com with your existing Espeezy session.' },
      { title: 'Professional delivery', body: 'Listings, jobs, invoices, and payouts are managed in Studio.' },
    ],
  },
  '/assets': {
    id: 'assets',
    pageTitle: 'Files',
    summary: 'Upload files and links, organize folders, and manage storage for your team.',
    steps: [
      { title: 'Upload', body: 'Add files and links into folders for your team.' },
      { title: 'Organize', body: 'Create folders and browse with the path breadcrumb.' },
      { title: 'Storage', body: 'Usage follows your plan tier (Free 1 GB, Pro 5 GB, Premium 20 GB).' },
    ],
    actions: [
      { label: 'Add file', hint: 'Upload or save a link' },
      { label: 'New folder', hint: 'Group related files' },
    ],
  },
  '/settings': {
    id: 'settings',
    pageTitle: 'Settings',
    summary: 'Profile, storage, themes, and account security.',
    steps: [
      { title: 'Profile', body: 'Update display name, avatar, and academic details.' },
      { title: 'Storage', body: 'View usage and manage files from the Storage tab.' },
      { title: 'Design', body: 'Themes sync across Kanban, Games, and Studio when signed in.' },
    ],
  },
  '/network': {
    id: 'network',
    pageTitle: 'Teammates',
    summary: 'Connect with peers and open message threads.',
    steps: [
      { title: 'Connections', body: 'Send and accept requests to collaborate.' },
      { title: 'Messages', body: 'Peer chats and team coordination live under Messages.' },
    ],
  },
  '/': {
    id: 'kanban',
    pageTitle: 'Workspace',
    summary: 'Your Kanban board for tasks, activity, and team coordination.',
    steps: [
      { title: 'Board', body: 'Drag cards between To Do, In Progress, and Done.' },
      { title: 'Tasks', body: 'Open a card for details, assignees, comments, and due dates.' },
      { title: 'Navigate', body: 'Use the sidebar for Feed, Marketplace, Studio, and Settings.' },
    ],
    actions: [
      { label: 'New task', hint: 'Add work to your board' },
      { label: 'Sidebar', hint: 'Navigate any workspace area' },
    ],
  },
  '/resources': {
    id: 'resources',
    pageTitle: 'Resources',
    summary: 'Curated links and materials for your team or course.',
    steps: [{ title: 'Browse', body: 'Filter by category and save useful items to your library.' }],
  },
  '/plans': {
    id: 'plans',
    pageTitle: 'Plans',
    summary: 'Compare Free, Pro, and Premium tiers for storage and features.',
    steps: [
      { title: 'Upgrade', body: 'Higher tiers unlock more storage and premium capabilities.' },
      { title: 'Credits', body: 'Espeezy credits power marketplace checkout and asset values.' },
    ],
  },
  '/profile': {
    id: 'profile',
    pageTitle: 'My profile',
    summary: 'Your public academic identity on Espeezy.',
    steps: [
      { title: 'Avatar', body: 'Upload a photo so teammates recognize you in Feed and messages.' },
      { title: 'Details', body: 'Program, year, and bio appear on your profile card.' },
    ],
  },
  '/jukebox': {
    id: 'jukebox',
    pageTitle: 'Espeezy Jukebox',
    summary: 'Pro feature: share what you are listening to with your study group.',
    steps: [
      { title: 'Unlock', body: 'Upgrade to Pro or Premium from Plans to enable Jukebox.' },
      { title: 'Presence', body: 'When connected, your track can appear on your profile presence.' },
    ],
  },
}

export function getGuideForPath(pathname: string | null): PageGuideConfig | null {
  if (!pathname) return null
  const base = pathname.split('?')[0]
  if (GUIDES[base]) return GUIDES[base]
  if (base.startsWith('/network/messages')) {
    return {
      id: 'messages',
      pageTitle: 'Messages',
      summary: 'Chat with sellers and peers. Keep conversations respectful and within platform policy.',
      steps: [
        { title: 'Listing context', body: 'Threads started from a listing include that item for reference.' },
        { title: 'Policy', body: 'No spam, harassment, or off-platform payment requests.' },
      ],
    }
  }
  return null
}

export function guideStorageKey(guideId: string): string {
  return `espeezy_guide_${guideId}_dismissed`
}
