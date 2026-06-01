export type DemoTask = {
  id: string
  title: string
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done'
  category: string
  contributors: string[]
}

export const DEMO_PROJECT_NAME = 'Group Project — Product Design'

export const DEMO_COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'] as const

export const DEMO_TASKS: DemoTask[] = [
  {
    id: '1',
    title: 'Split research questions by section',
    status: 'Done',
    category: 'Planning',
    contributors: ['Alex', 'Jordan'],
  },
  {
    id: '2',
    title: 'Wireframe dashboard layout',
    status: 'In Review',
    category: 'Design',
    contributors: ['Sam'],
  },
  {
    id: '3',
    title: 'Build contribution export view',
    status: 'In Progress',
    category: 'Engineering',
    contributors: ['Alex', 'Sam', 'Jordan'],
  },
  {
    id: '4',
    title: 'User testing script',
    status: 'To Do',
    category: 'Research',
    contributors: ['Jordan'],
  },
  {
    id: '5',
    title: 'Final presentation slides',
    status: 'To Do',
    category: 'Delivery',
    contributors: ['Alex'],
  },
]
