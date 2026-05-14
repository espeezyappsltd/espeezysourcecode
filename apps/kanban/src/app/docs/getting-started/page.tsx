'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, UserPlus, Users, Sparkles } from 'lucide-react'

export default function GettingStarted() {
  const steps = [
    {
      icon: <UserPlus size={24} />,
      title: 'Initialize Workspace',
      description: 'The journey begins by creating your profile. Select your academic field and set up your institutional identity.'
    },
    {
      icon: <Users size={24} />,
      title: 'Assemble your Team',
      description: 'Connect with classmates through the Peer Network. Once connected, you can form a new group or join an existing project.'
    },
    {
      icon: <Sparkles size={24} />,
      title: 'Configure Protocols',
      description: 'Set up your Kanban board, define intervals in your Roadmap, and start collaborating in real-time. Your effort is now being logged.'
    }
  ]

  return (
    <div className="docs-content">
      <div style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
          Quick Start Guide
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#9ca3af', lineHeight: 1.6 }}>
          Set up your first automated research project in less than 5 minutes. 
          Follow these steps to initialize your team and start contributing.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginBottom: '4rem' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ 
                width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981', borderRadius: '12px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                {step.icon}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                {i + 1}. {step.title}
              </h3>
              <p style={{ color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <h4 style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <CheckCircle2 size={18} /> Pro-Tip for New Teams
        </h4>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#f3f4f6', lineHeight: 1.6 }}>
          Always start by defining your <strong>Academic Roadmap</strong>. This ensures everyone in the group knows the high-level milestones before you start moving tasks on the Kanban board.
        </p>
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem' }}>← Introduction</Link>
        <Link href="/docs/features/kanban" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Features: Kanban →</Link>
      </div>
    </div>
  )
}
