'use client'

import { useEffect } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'

const MODULES = [
  {
    title: 'Monorepo ports',
    body: 'Hub :3000 · Kanban :3001 · Games :3002 · Dashboard :3003 · Admin :3004 · Prereg :3005 · Core :3006',
  },
  {
    title: 'Staff sign-in',
    body: 'Use username (pete) at /login — not email. Roles: superuser, admin, moderator, viewer.',
  },
  {
    title: 'Private files vault',
    body: 'Each admin gets 5GB. Create folders, upload files, share read access with other staff.',
  },
  {
    title: 'Supabase env',
    body: 'Run npm run sync:supabase-env at repo root to propagate service role keys to all apps.',
  },
  {
    title: 'RBAC',
    body: 'Navigation items are filtered by admin_members.admin_role. API routes use requireAdmin(permission).',
  },
  {
    title: 'Deployments',
    body: 'Use Launch for go-live config. Audit log tracks sensitive actions.',
  },
]

export default function AdminLearnPage() {
  const { setPageHint } = useAdminOnboarding()

  useEffect(() => {
    setPageHint('Dev learning — internal runbooks and onboarding for Espeezy staff.')
  }, [setPageHint])

  return (
    <>
      <AdminPageHeader
        title="Dev learning"
        description="Onboarding paths and reference material for Espeezy administrators."
      />
      <div className="admin-console-learn-grid">
        {MODULES.map((m) => (
          <article key={m.title} className="admin-console-learn-card">
            <h3>{m.title}</h3>
            <p>{m.body}</p>
          </article>
        ))}
      </div>
    </>
  )
}
