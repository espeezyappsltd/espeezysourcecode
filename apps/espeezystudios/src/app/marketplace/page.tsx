import Link from 'next/link'
import StudioPageShell from '@/components/StudioPageShell'
import { Briefcase, Receipt, ShoppingBag, TrendingUp, LayoutDashboard } from 'lucide-react'

import { STUDIO_PAGE_COPY } from '@/lib/studio/ui-copy'

const HUB_LINKS = [
  {
    href: '/jobs',
    title: 'Professional projects',
    description: 'Timeline, milestones, budgets, PRD, delivery docs, and client invoicing.',
    icon: Briefcase,
  },
  {
    href: '/jobs',
    title: 'List & deliver gigs',
    description: 'Create projects, track progress, and email receipts when delivery is complete.',
    icon: Receipt,
  },
  {
    href: '/analytics',
    title: 'Studio analytics',
    description: 'Charts and operational metrics for your studio pipeline.',
    icon: TrendingUp,
  },
  {
    href: '/team',
    title: 'Team & clients',
    description: 'Manage studio team roster and client-facing project categories.',
    icon: ShoppingBag,
  },
  {
    href: '/dashboard',
    title: 'Dashboard Overview',
    description: 'Manage applications and users in the new dashboard hub.',
    icon: LayoutDashboard,
  },
] as const

export default function StudioHubPage() {
  return (
    <StudioPageShell
      title="Studio hub"
      description={STUDIO_PAGE_COPY.studioHub}
      wide
      centered
    >
      <p className="studio-muted" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
        Kanban is for study, collaboration, and communication. Premium members sign on from Kanban to manage
        client projects and delivery in Studio.
      </p>

      <div className="card-grid">
        {HUB_LINKS.map(({ href, title, description, icon: Icon }) => (
          <Link key={title} href={href} className="studio-card studio-hub-card">
            <Icon size={22} aria-hidden style={{ color: 'var(--studios-brand)', marginBottom: '0.35rem' }} />
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem' }}>{title}</h3>
            <p className="studio-muted" style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45 }}>
              {description}
            </p>
          </Link>
        ))}
      </div>

      <p className="studio-muted" style={{ marginTop: '0.75rem', fontSize: '0.78rem' }}>
        Need Kanban?{' '}
        <a href="https://kanban.espeezy.com" className="studio-link">
          Return to workspace
        </a>
      </p>
    </StudioPageShell>
  )
}
