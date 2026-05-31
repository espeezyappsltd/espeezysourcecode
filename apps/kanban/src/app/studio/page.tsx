'use client'

import { ArrowRight, Briefcase, Sparkles } from 'lucide-react'
import PremiumFeatureGate from '@/components/PremiumFeatureGate'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProfile } from '@/context/ProfileContext'
import { useStudioLink } from '@/hooks/useStudioLink'
import { hasFeature } from '@/utils/feature-gate'
import { STUDIOS_MARKETPLACE_PATH } from '@shared/cross-app-auth'

export default function StudioSignOnPage() {
  const { profile } = useProfile()
  const studioUrl = useStudioLink(STUDIOS_MARKETPLACE_PATH)

  if (!hasFeature(profile, 'ESPEEZY_STUDIO')) {
    return (
      <div className="page-fade page-shell page-shell--narrow">
        <PremiumFeatureGate feature="ESPEEZY_STUDIO" />
      </div>
    )
  }

  return (
    <div className="page-fade page-shell page-shell--narrow">
      <PageHeader title="Espeezy Studio" icon={Briefcase} />

      <section className="ui-panel" style={{ padding: '1.5rem', maxWidth: '640px', margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.65rem',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--brand)',
            marginBottom: '0.75rem',
          }}
        >
          <Sparkles size={12} aria-hidden /> Premium workspace
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 950, margin: '0 0 0.65rem', letterSpacing: '-0.02em' }}>
          Marketplace, jobs &amp; client delivery
        </h2>
        <p style={{ color: 'var(--text-sub)', lineHeight: 1.55, margin: '0 0 1.25rem', fontSize: '0.95rem' }}>
          Kanban stays focused on study and collaboration. Espeezy Studio is where you list work, run jobs,
          invoices, and marketplace operations — included with Premium Scholar.
        </p>
        <ul style={{ margin: '0 0 1.5rem', paddingLeft: '1.2rem', color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <li>Professional jobs pipeline with milestones &amp; delivery</li>
          <li>Marketplace listings and client billing</li>
          <li>Team analytics and studio admin tools</li>
        </ul>
        <a
          href={studioUrl}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.5rem',
            fontWeight: 900,
            textDecoration: 'none',
          }}
        >
          Sign on to Studio <ArrowRight size={18} aria-hidden />
        </a>
      </section>
    </div>
  )
}
