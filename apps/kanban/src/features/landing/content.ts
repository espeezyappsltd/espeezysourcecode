export const FEATURES = [
  {
    icon: '📋',
    title: 'Academic Kanban Boards',
    description:
      'Drag-and-drop boards built for coursework. Organize tasks by subject, deadline priority, or custom workflow. Exactly how your brain works.',
  },
  {
    icon: '👥',
    title: 'Group Project Management',
    description:
      'Assign tasks to teammates, track individual contributions, and surface blockers before they become problems. No more "who\'s doing what?"',
  },
  {
    icon: '📈',
    title: 'Contribution Analytics',
    description:
      'See exactly how much each team member has contributed with burndown charts, activity heatmaps, and weekly velocity reports.',
  },
  {
    icon: '🔔',
    title: 'Smart Deadline Alerts',
    description:
      'AI-powered deadline predictions based on your workload. Get nudged when a task is at risk before it\'s too late to recover.',
  },
  {
    icon: '🔗',
    title: 'Espeezy Integration',
    description:
      'Kanban cards link directly to your Espeezy notes, documents, and peer sessions. Everything lives in one connected workspace.',
  },
  {
    icon: '📱',
    title: 'Mobile & Offline First',
    description:
      'Full-featured mobile app with offline sync. Update your board from the library, on the bus, or anywhere without a signal.',
  },
] as const

export const BOARD_PREVIEW = [
  {
    column: 'To Do',
    color: '#475569',
    cards: ['Literature review', 'Write abstract', 'Format citations'],
  },
  {
    column: 'In Progress',
    color: '#6366f1',
    cards: ['Data analysis', 'Methodology draft'],
  },
  {
    column: 'Done',
    color: '#10b981',
    cards: ['Project setup', 'Research brief', 'Team kickoff'],
  },
] as const
