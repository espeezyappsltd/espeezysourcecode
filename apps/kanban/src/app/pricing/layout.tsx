import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Espeezy Kanban',
  description: 'Choose a plan and sign up or upgrade with the right checkout flow for your tier.',
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
