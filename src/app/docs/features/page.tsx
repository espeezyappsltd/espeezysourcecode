'use client'

import React from 'react'
import Link from 'next/link'
import { 
  LayoutGrid, Milestone, Users, ShoppingBag, 
  Gamepad2, Search, MessageSquare, Activity,
  Palette, FileCheck, Zap
} from 'lucide-react'

export default function FeaturesDocs() {
  const features = [
    {
      icon: <LayoutGrid size={24} />,
      title: 'Digital Kanban Board',
      eli12: "It's like having digital sticky notes on a wall. You move them from 'To-Do' to 'Finished' so everyone knows what is happening."
    },
    {
      icon: <Milestone size={24} />,
      title: 'Academic Roadmap',
      eli12: "A colorful path that shows the 5 big steps of your project. It helps the whole team steer the ship in the right direction."
    },
    {
      icon: <Users size={24} />,
      title: 'Peer Network',
      eli12: "A school-wide helper. It helps you find and connect with other students who have the skills you need for your project."
    },
    {
      icon: <ShoppingBag size={24} />,
      title: 'Share & Borrow',
      eli12: "Need a textbook or a specific tool? You can borrow items from other students in the marketplace, just like a library."
    },
    {
      icon: <Gamepad2 size={24} />,
      title: 'Skirmish Games',
      eli12: "Fun, quick games where you can compete with your friends to see who knows the most about your subjects."
    },
    {
      icon: <Search size={24} />,
      title: 'Smart Search (Cmd+K)',
      eli12: "A magic search box. Type one word and it finds students, tasks, or teams instantly from anywhere in the app."
    },
    {
      icon: <MessageSquare size={24} />,
      title: 'Team Chat',
      eli12: "Instant messaging built right into your project. You can talk to your team without ever leaving Espeezy."
    },
    {
      icon: <Zap size={24} />,
      title: 'Presence Dots',
      eli12: "Little green circles that light up when your friends are online. No more wondering if your teammates are working!"
    },
    {
      icon: <Activity size={24} />,
      title: 'Skill Charts (Analytics)',
      eli12: "Cool graphs and charts that show what you're good at, like 'Writing' or 'Researching'. It helps your team use everyone's talents."
    },
    {
      icon: <Palette size={24} />,
      title: 'Custom Themes',
      eli12: "You can change the way the app looks! Pick from different color styles like 'Cyberpunk' or 'Deep Oceanic'."
    },
    {
      icon: <FileCheck size={24} />,
      title: 'Work Proof (Audit Logs)',
      eli12: "A digital history book. It logs every piece of work done by every person, so everyone gets the credit they deserve fairly."
    }
  ]

  return (
    <div className="docs-content">
      <div style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
          All Espeezy Features
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#9ca3af', lineHeight: 1.6 }}>
          Explore every capability of the Espeezy ecosystem. We&apos;ve explained everything in simple terms 
          to make sure your whole team can get started quickly.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {features.map((feature, i) => (
          <div key={i} style={{ 
            padding: '2rem', background: '#111', borderRadius: '16px', 
            border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '1rem' 
          }}>
            <div style={{ color: '#10b981' }}>{feature.icon}</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{feature.title}</h3>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
              {feature.eli12}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid #222', display: 'flex', justifyContent: 'center' }}>
        <Link href="/login?signup=true" style={{ 
          background: '#10b981', color: '#0a0a0a', padding: '1rem 2.5rem', 
          borderRadius: '12px', textDecoration: 'none', fontWeight: 900,
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
        }}>
          Try these features now
        </Link>
      </div>
    </div>
  )
}
