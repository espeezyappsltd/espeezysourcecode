import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in — Espeezy Kanban',
}

/** Login uses a minimal shell (no dashboard chrome from root layout children branch). */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
