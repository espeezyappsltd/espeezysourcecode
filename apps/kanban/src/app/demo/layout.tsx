import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kanban demo — Espeezy',
  description: 'Preview the Espeezy Kanban workspace. Sign up to create boards with your team.',
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
