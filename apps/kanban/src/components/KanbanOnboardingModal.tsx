'use client'

import React, { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Layout, MousePointer2, Users, CheckCircle, Zap } from 'lucide-react'

interface KanbanOnboardingModalProps {
  onClose: () => void
}

const STEPS = [
  {
    title: 'Welcome to Kanban',
    desc: 'The Kanban board is your team\'s command center. It helps you visualize workflow, limit work-in-progress, and maximize efficiency.',
    icon: <Layout size={40} color="#10B981" />,
    image: '/onboarding/kanban-1.png' // Placeholder or illustration
  },
  {
    title: 'Create & Manage Tasks',
    desc: 'Click the "+" button in any column to create a task. You can set titles, descriptions, due dates, and priority levels.',
    icon: <MousePointer2 size={40} color="#3B82F6" />,
    image: '/onboarding/kanban-2.png'
  },
  {
    title: 'Team Collaboration',
    desc: 'Assign tasks to yourself or your teammates. Everyone sees updates in real-time, so nobody ever double-works a task.',
    icon: <Users size={40} color="#F59E0B" />,
    image: '/onboarding/kanban-3.png'
  },
  {
    title: 'Move & Progress',
    desc: 'Drag tasks across columns as they progress from "To Do" to "Done". This keeps the entire team aligned on what\'s happening now.',
    icon: <Zap size={40} color="#EF4444" />,
    image: '/onboarding/kanban-4.png'
  },
  {
    title: 'Master Your Workflow',
    desc: 'That\'s it! You\'re ready to lead your team to success. Remember: Keep it simple, keep it moving, and keep it collaborative.',
    icon: <CheckCircle size={40} color="#10B981" />,
    image: '/onboarding/kanban-5.png'
  }
]

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
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#18181b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px' }}>
              <Layout size={18} color="#10B981" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Kanban Tutorial</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            {step.icon}
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 950, color: '#fff', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            {step.title}
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#a1a1aa', lineHeight: 1.6, margin: '0 auto', maxWidth: '400px' }}>
            {step.desc}
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  width: i === currentStep ? '24px' : '8px', 
                  height: '8px', 
                  borderRadius: '10px', 
                  background: i === currentStep ? '#10B981' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease'
                }} 
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {currentStep > 0 && (
              <button 
                onClick={prevStep}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button 
              onClick={nextStep}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '12px',
                background: '#10B981',
                border: 'none',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
              }}
            >
              {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
