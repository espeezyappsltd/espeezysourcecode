'use client'

import { LayoutDashboard, Users, FileCheck } from 'lucide-react'
import './landing.css'

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'One shared board',
    body: 'Every member sees the same tasks, deadlines, and updates, which reduces miscommunication during group assignments.',
  },
  {
    icon: Users,
    title: 'Proof of contribution',
    body: 'Espeezy records who moved work forward, so each contributor receives fair credit and instructors can review activity.',
  },
  {
    icon: FileCheck,
    title: 'Ready for review',
    body: 'Export a structured summary to share with professors, teaching assistants, recruiters, or teammates when the project concludes.',
  },
] as const

export default function LandingFeaturesSection() {
  return (
    <section id="features" className="landing-section landing-section--muted" aria-labelledby="features-heading">
      <div className="landing-inner">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p className="landing-eyebrow" style={{ marginBottom: '1rem' }}>
            Why Espeezy Kanban
          </p>
          <h2 id="features-heading" className="landing-title">
            Structured collaboration for academic teams
          </h2>
          <p className="landing-lead">
            Espeezy Kanban helps students coordinate group work and gives instructors a clear record of individual contribution.
          </p>
        </div>

        <div className="landing-features-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="landing-feature-card">
              <span className="landing-feature-card__icon" aria-hidden>
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
