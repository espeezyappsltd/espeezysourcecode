'use client'

import Link from 'next/link'
import { ArrowRight, Info, Users } from 'lucide-react'
import EspeezyAppLogo from '@shared/EspeezyAppLogo'
import { KANBAN_DEMO_LABEL } from '@shared/platform-brand'
import {
  DEMO_COLUMNS,
  DEMO_PROJECT_NAME,
  DEMO_TASKS,
  type DemoTask,
} from '@/lib/demo/demo-board'

const SIGNUP_HREF = '/login?signup=true'

function ContributorDots({ names }: { names: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.65rem' }}>
      <Users size={12} aria-hidden style={{ color: 'var(--text-sub)', flexShrink: 0 }} />
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {names.map((name) => (
          <span
            key={name}
            title={name}
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: 999,
              background: 'rgba(var(--brand-rgb, 16, 185, 129), 0.12)',
              color: 'var(--brand)',
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

function DemoCard({ task }: { task: DemoTask }) {
  return (
    <article className="kanban-card" style={{ cursor: 'default' }}>
      <div className="kanban-card-title">{task.title}</div>
      <span
        className="badge"
        style={{
          fontSize: '0.65rem',
          background: 'var(--bg-sub)',
          color: 'var(--text-sub)',
          border: '1px solid var(--border)',
        }}
      >
        {task.category}
      </span>
      <ContributorDots names={task.contributors} />
    </article>
  )
}

export default function KanbanDemoView() {
  return (
    <div
      data-testid="kanban-demo"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main, #f4f6f8)',
        color: 'var(--text-main, #0f172a)',
      }}
    >
      <div
        role="status"
        style={{
          background: 'var(--brand, #10b981)',
          color: '#fff',
          padding: '0.65rem 1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        {KANBAN_DEMO_LABEL}. Changes here are not saved.{' '}
        <Link href={SIGNUP_HREF} style={{ color: '#fff', textDecoration: 'underline', fontWeight: 800 }}>
          Sign up free
        </Link>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '1.5rem max(1rem, env(safe-area-inset-right))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
            <EspeezyAppLogo app="kanban" variant="nav" />
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-ghost btn-sm btn-inline" style={{ width: 'auto' }}>
              Log in
            </Link>
            <Link href={SIGNUP_HREF} className="btn btn-primary btn-sm btn-inline" style={{ width: 'auto' }}>
              Sign up
              <ArrowRight size={14} aria-hidden style={{ marginLeft: 4 }} />
            </Link>
          </div>
        </header>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, margin: '0 0 0.35rem' }}>
            {DEMO_PROJECT_NAME}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-sub, #64748b)', fontSize: '0.95rem', maxWidth: 560 }}>
            See how Espeezy Kanban tracks tasks and who contributed. Create an account to use a real board with your
            team.
          </p>
        </div>

        <div
          className="kanban-board"
          role="region"
          aria-label="Kanban board preview"
          data-testid="kanban-board"
        >
          {DEMO_COLUMNS.map((col) => {
            const tasks = DEMO_TASKS.filter((t) => t.status === col)
            return (
              <section key={col} className="kanban-column" aria-label={col}>
                <div className="kanban-column-header">
                  <span>{col}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{tasks.length}</span>
                </div>
                <div className="kanban-task-list">
                  {tasks.map((task) => (
                    <DemoCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <div
          style={{
            marginTop: '2rem',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius, 12px)',
            border: '1px dashed var(--brand, #10b981)',
            background: 'rgba(16, 185, 129, 0.06)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
          }}
        >
          <Info size={22} style={{ color: 'var(--brand)', flexShrink: 0 }} aria-hidden />
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 800 }}>Ready for your own project?</h2>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Sign up at kanban.espeezy.com to create teams, assign tasks, and export contribution history for coursework.
            </p>
            <Link href={SIGNUP_HREF} className="btn btn-primary btn-inline" style={{ width: 'auto' }}>
              Create your account
              <ArrowRight size={16} aria-hidden style={{ marginLeft: 4 }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
