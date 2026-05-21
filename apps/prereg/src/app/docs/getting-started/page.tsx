import Link from 'next/link'
import {
  GETTING_STARTED_STEP_1_DESC,
  GETTING_STARTED_STEP_1_TITLE,
} from '@shared/platform-brand'

export default function GettingStartedPage() {
  const steps = [
    {
      step: '01',
      title: GETTING_STARTED_STEP_1_TITLE,
      desc: GETTING_STARTED_STEP_1_DESC,
    },
    {
      step: '02',
      title: 'Assemble Your Team',
      desc: 'Invite teammates by sharing your team name and secure login code.',
    },
    {
      step: '03',
      title: 'Start Collaborating',
      desc: 'Start collaborating on your project in real time. Add tasks, assign them to teammates, and start working together. Your work is being logged in real time.',
    },
    {
      step: '04',
      title: 'Manage Your Project',
      desc: 'Manage your project in real time. Add tasks, assign them to teammates, and start working together. View real-time project analytics on project stats page in the sidebar, exportable to Excel at any time.',
    },
    {
      step: '05',
      title: 'Export Your Data',
      desc: 'Export your project data to Excel at any time and see how your team is contributing to the project.',
    },
  ]

  return (
    <div className="docs-content">
      <div style={{ color: '#10b981', fontSize: '2.5rem', marginBottom: '1.5rem' }}>⚡</div>
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.25rem', color: '#f3f4f6' }}>
        Quick Start Guide
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#9ca3af', lineHeight: 1.65, marginBottom: '3rem', maxWidth: '640px' }}>
        Get your team collaborating with a clear academic record in three steps. No credit card required for the core platform.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: '#10b981' }}>
              {s.step}
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#f3f4f6' }}>{s.title}</h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.65, fontSize: '0.9rem', margin: 0 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1.5rem', marginBottom: '3rem' }}>
        <p style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem', marginBottom: '0.5rem' }}>ELI12</p>
        <p style={{ color: '#9ca3af', lineHeight: 1.65, fontSize: '0.9rem', margin: 0 }}>
          It&apos;s like setting up a new base in a game. You create your character (profile), find your team, and start your first mission. Done in under 2 minutes!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #222', paddingTop: '2rem' }}>
        <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Home</Link>
        <Link href="/docs/features/kanban" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, marginLeft: 'auto' }}>Next: Kanban Boards →</Link>
      </div>
    </div>
  )
}
