'use client'

import React, { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Layout, MousePointer2, Users, CheckCircle, Zap } from 'lucide-react'
import AppCopyrightStrip from '@shared/AppCopyrightStrip'

interface KanbanOnboardingModalProps {
  onClose: () => void
}

const STEPS = [
  {
    title: 'Introduction to the Kanban board',
    desc: 'The board visualizes your team workflow. Columns represent stages of work so everyone understands current priorities and progress.',
    icon: <Layout size={40} color="#10B981" />,
    image: '/onboarding/kanban-1.png',
  },
  {
    title: 'Create and manage tasks',
    desc: 'Add a task from any column. Each card supports a title, description, due date, priority level, and assigned teammates.',
    icon: <MousePointer2 size={40} color="#3B82F6" />,
    image: '/onboarding/kanban-2.png',
  },
  {
    title: 'Collaborate with your team',
    desc: 'Assign tasks to yourself or teammates. Updates sync in real time so the board reflects the latest project state.',
    icon: <Users size={40} color="#F59E0B" />,
    image: '/onboarding/kanban-3.png',
  },
  {
    title: 'Track progress across columns',
    desc: 'Move cards from To Do through In Progress to Done as work advances. This keeps status visible for instructors and teammates.',
    icon: <Zap size={40} color="#EF4444" />,
    image: '/onboarding/kanban-4.png',
  },
  {
    title: 'You are ready to begin',
    desc: 'Use the board consistently to document contribution. Clear task ownership supports fair grading and team accountability.',
    icon: <CheckCircle size={40} color="#10B981" />,
    image: '/onboarding/kanban-5.png',
  },
] as const

export default function KanbanOnboardingModal({ onClose }: KanbanOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = STEPS[currentStep]

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#18181b',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-onboarding-title"
      >
        <div style={{ padding: '2rem 2rem 1rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>{step.icon}</div>
          <h2 id="kanban-onboarding-title" style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            {step.title}
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>{step.desc}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0 2rem 1.5rem' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentStep ? '#10B981' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
              }}
              aria-hidden
            />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 2rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'none',
              border: 'none',
              color: currentStep === 0 ? '#475569' : '#94a3b8',
              cursor: currentStep === 0 ? 'default' : 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <ChevronLeft size={18} aria-hidden /> Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#10B981',
              border: 'none',
              color: '#fff',
              padding: '0.65rem 1.25rem',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {currentStep === STEPS.length - 1 ? 'Finish' : 'Continue'}
            {currentStep < STEPS.length - 1 ? <ChevronRight size={18} aria-hidden /> : null}
          </button>
        </div>
        <div style={{ padding: '0 2rem 1.25rem' }}>
          <AppCopyrightStrip style={{ color: '#64748b', textAlign: 'center' }} />
        </div>
      </div>
    </div>
  )
}
