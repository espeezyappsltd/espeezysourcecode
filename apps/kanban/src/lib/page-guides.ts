export type PageGuideStep = {
  title: string
  body: string
}

export type PageGuideConfig = {
  id: string
  pageTitle: string
  summary: string
  steps: PageGuideStep[]
  actions?: { label: string; hint: string }[]
}

const GUIDES: Record<string, PageGuideConfig> = {
  '/dashboard': {
    id: 'dashboard',
    pageTitle: 'Dashboard',
    summary: 'Your command center for tasks, activity, and team pulse.',
    steps: [
      { title: 'Overview', body: 'Scan open tasks, deadlines, and cohort activity at a glance.' },
      { title: 'Quick actions', body: 'Jump to Kanban, Feed, or Marketplace from the sidebar.' },
    ],
    actions: [{ label: 'Sidebar', hint: 'Navigate any workspace area' }],
  },
  '/feed': {
    id: 'feed',
    pageTitle: 'Academic Journeys',
    summary: 'Share milestones and react to your cohort in real time.',
    steps: [
      { title: 'Compose', body: 'Post updates with public or connections-only visibility.' },
      { title: 'Engage', body: 'React and comment to support peers on their journey.' },
      { title: 'Stories', body: 'Active scholars appear at the top when they have recent posts.' },
    ],
  },
  '/hustle': {
    id: 'hustle',
    pageTitle: 'Hustle Board',
    summary: 'Browse campus gigs, post tasks, and track your earnings.',
    steps: [
      { title: 'Browse', body: 'Filter open tasks by category or smart search.' },
      { title: 'Post', body: 'Create gigs with payout, category, and description.' },
      { title: 'Mine', body: 'Track tasks you posted or accepted under My Tasks.' },
    ],
  },
  '/marketplace': {
    id: 'marketplace',
    pageTitle: 'Campus Marketplace',
    summary: 'Buy and sell with Espeezy credits; invoices for every party.',
    steps: [
      { title: 'Search & filter', body: 'Use categories and search — listings load in pages for speed.' },
      { title: 'Checkout', body: 'Pay with credits; sellers receive notifications and invoices.' },
      { title: 'Contact', body: 'Message sellers per platform rules from any listing.' },
    ],
    actions: [{ label: 'Post item', hint: 'List textbooks, gear, and more' }],
  },
  '/assets': {
    id: 'assets',
    pageTitle: 'Personal Arsenal',
    summary: 'Store files, organize folders, set credit values, and list on the marketplace.',
    steps: [
      { title: 'Virtual folders', body: 'Create folders, navigate with breadcrumbs, and upload into the current folder.' },
      { title: 'Credit value', body: 'Set 0–100 credits per asset; totals show GBP equivalent for planning.' },
      { title: 'List for sale', body: 'One click pushes an asset to Campus Marketplace using its credit value as price.' },
      { title: 'Storage', body: 'Usage follows your plan tier (Free 1 GB, Pro 5 GB, Premium 20 GB).' },
    ],
    actions: [
      { label: 'Add Asset', hint: 'Upload a file or save a link' },
      { label: 'New Folder', hint: 'Organize before you upload' },
    ],
  },
  '/settings': {
    id: 'settings',
    pageTitle: 'Settings',
    summary: 'Profile, billing, storage node, and account security.',
    steps: [
      { title: 'Profile', body: 'Update display name, avatar, and academic details.' },
      { title: 'Storage', body: 'View usage and manage assets from the Storage tab.' },
      { title: 'Billing', body: 'Credits, wallet history, and subscription plan.' },
    ],
  },
  '/network': {
    id: 'network',
    pageTitle: 'Teammates',
    summary: 'Connect with peers and open message threads.',
    steps: [
      { title: 'Connections', body: 'Send and accept requests to collaborate.' },
      { title: 'Messages', body: 'Marketplace and peer chats live under Messages.' },
    ],
  },
  '/': {
    id: 'kanban',
    pageTitle: 'Kanban Board',
    summary: 'Plan coursework and projects with columns, cards, and deadlines.',
    steps: [
      { title: 'Columns', body: 'Drag cards between To Do, In Progress, and Done.' },
      { title: 'Tasks', body: 'Open a card for details, assignees, comments, and due dates.' },
    ],
    actions: [{ label: 'New task', hint: 'Add work to your board' }],
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
