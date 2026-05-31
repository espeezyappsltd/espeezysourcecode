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
    pageTitle: 'Academic Journeys',
    theme: 'journeys',
    emoji: '✨',
    summary: 'Share milestones and react to your cohort in real time.',
    steps: [
      { title: 'Compose', body: 'Post updates with public or connections-only visibility.' },
      { title: 'Engage', body: 'React and comment to support peers on their journey.' },
      { title: 'Stories', body: 'Active scholars appear at the top when they have recent posts.' },
    ],
    actions: [
      { label: 'Post', hint: 'Share a milestone' },
      { label: 'React', hint: 'Support your cohort' },
    ],
  },
  '/studio': {
    id: 'studio',
    pageTitle: 'Espeezy Studio',
    theme: 'default',
    emoji: '🏢',
    summary: 'Premium sign-on for marketplace, jobs, and client delivery (migrated from Kanban).',
    steps: [
      { title: 'Premium only', body: 'Upgrade to Premium Scholar in Kanban to unlock Studio access.' },
      { title: 'Sign on', body: 'Use the button to open studios.espeezy.com with your Espeezy session.' },
      { title: 'Monetize there', body: 'Listings, jobs, invoices, and payouts live in Studio — not Kanban.' },
    ],
  },
  '/assets': {
    id: 'assets',
    pageTitle: 'My Files',
    summary: 'Store files and links for study and collaboration.',
    steps: [
      { title: 'Upload', body: 'Add files and links organized in folders for your team.' },
      { title: 'Storage', body: 'Usage follows your plan tier (Free 1 GB, Pro 5 GB, Premium 20 GB).' },
      { title: 'Marketplace', body: 'Selling and billing moved to Espeezy Studio (Premium).' },
    ],
    actions: [
      { label: 'Add file', hint: 'Upload or save a link' },
      { label: 'Studio', hint: 'Premium marketplace' },
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
    summary: 'Your Kanban board and command center for tasks, activity, and team pulse.',
    steps: [
      { title: 'Board', body: 'Drag cards between To Do, In Progress, and Done.' },
      { title: 'Tasks', body: 'Open a card for details, assignees, comments, and due dates.' },
      { title: 'Navigate', body: 'Use the sidebar for Feed, Marketplace, Hustle, and Settings.' },
    ],
    actions: [
      { label: 'New task', hint: 'Add work to your board' },
      { label: 'Sidebar', hint: 'Navigate any workspace area' },
    ],
  },
  '/resources': {
    id: 'resources',
    pageTitle: 'Resources',
    summary: 'Curated links and materials for your cohort.',
    steps: [{ title: 'Browse', body: 'Filter by category and save useful items to your arsenal.' }],
  },
  '/plans': {
    id: 'plans',
    pageTitle: 'Plans',
    summary: 'Compare Free, Pro, and Premium tiers for storage and features.',
    steps: [
      { title: 'Upgrade', body: 'Higher tiers unlock more storage and premium areas.' },
      { title: 'Credits', body: 'Espeezy credits power marketplace checkout and asset values.' },
    ],
  },
  '/profile': {
    id: 'profile',
    pageTitle: 'My Profile',
    summary: 'Your public academic identity on Espeezy.',
    steps: [
      { title: 'Avatar', body: 'Upload a photo so teammates recognize you in Feed and Hustle.' },
      { title: 'Details', body: 'Program, year, and bio appear on your profile card.' },
    ],
  },
  '/jukebox': {
    id: 'jukebox',
    pageTitle: 'Espeezy Jukebox',
    summary: 'Pro feature: share what you are listening to with your cohort.',
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
      summary: 'Chat with sellers and peers. Keep deals on-campus and respectful.',
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
