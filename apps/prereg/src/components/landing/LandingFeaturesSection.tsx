'use client'

import { LayoutDashboard, Users, FileCheck } from 'lucide-react'
import './landing.css'

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'One shared board',
    body: 'Everyone sees the same tasks, deadlines, and updates — no more “I didn’t know that was my part.”',
  },
  {
    icon: Users,
    title: 'Proof of contribution',
    body: 'Espeezy records who moved work forward, so quiet contributors get credit and teams stay fair.',
  },
  {
    icon: FileCheck,
    title: 'Ready for grading',
    body: 'Export a clear summary you can share with professors, TAs, recruiters, or teammates when the project wraps.',
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
            Group work that feels fair
          </h2>
          <p className="landing-lead">
            Built for students who are tired of carrying the project alone — and instructors who want clear evidence of who contributed.
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
