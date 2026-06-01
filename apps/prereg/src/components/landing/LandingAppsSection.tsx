'use client'

import Link from 'next/link'
import { ESPEEZY_APPS_IN_USE } from '@shared/platform-docs-content'
import { AppsInUseGrid } from '@/components/AppsInUseGrid'
import './landing.css'

export default function LandingAppsSection() {
  return (
    <section id="apps" className="landing-section landing-section--muted" aria-labelledby="apps-heading">
      <div className="landing-inner">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 id="apps-heading" className="landing-title">
            Apps in use
          </h2>
          <p className="landing-lead" style={{ maxWidth: 520, margin: '0 auto' }}>
            Open the app you need. Same account across the platform.
          </p>
        </div>
        <AppsInUseGrid apps={ESPEEZY_APPS_IN_USE} variant="landing" />
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          <Link href="/docs/apps" className="landing-inline-link">
            Full app list and docs →
          </Link>
        </p>
      </div>
    </section>
  )
}
