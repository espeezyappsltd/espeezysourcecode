'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import KanbanBoard from '@/features/kanban/KanbanBoard'
import type { Profile } from '@/features/kanban/types'
import '@/features/kanban/kanban.css'

export function WorkspaceView() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTaskSignal] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.replace('/login?next=/dashboard')
        return
      }
      if (cancelled) return
      setUser(authUser)

      const { data: row } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (cancelled) return
      setProfile((row as Profile | null) ?? null)
      setLoading(false)
    }

    void load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.replace('/login?next=/dashboard')
      else setUser(session.user)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="kanban-workspace-loading" role="status" aria-live="polite">
        <Loader2 size={28} className="kanban-workspace-spinner" aria-hidden />
        Loading your workspace…
      </div>
    )
  }

  if (!user) return null

  if (!profile?.group_id) {
    return (
      <div className="kanban-workspace-setup">
        <Link href="/" className="kanban-home-btn kanban-home-btn--ghost" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
          <ArrowLeft size={16} aria-hidden />
          Back to Kanban Home
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.75rem' }}>Set up your team</h1>
        <p style={{ color: 'var(--text-sub)', lineHeight: 1.6, maxWidth: '480px', margin: '0 0 1.5rem' }}>
          Your account is ready, but you are not linked to a team workspace yet. Please contact your team administrator or support to be added to a workspace.
        </p>
        <a
          href="mailto:support@espeezy.com?subject=Join%20Team"
          className="kanban-home-btn kanban-home-btn--primary"
          style={{ display: 'inline-flex' }}
        >
          Contact Support
        </a>
      </div>
    )
  }

  const boardProfile: Profile = {
    ...profile,
    id: profile.id,
    email: profile.email ?? user.email ?? null,
  }

  return (
    <div className="kanban-workspace">
      <header className="kanban-workspace-bar">
        <Link href="/" className="kanban-home-btn kanban-home-btn--ghost">
          <ArrowLeft size={16} aria-hidden />
          Kanban Home
        </Link>
        <span className="kanban-workspace-email">{user.email}</span>
      </header>
      <KanbanBoard groupId={profile.group_id} profile={boardProfile} newTaskSignal={newTaskSignal} />
    </div>
  )
}
