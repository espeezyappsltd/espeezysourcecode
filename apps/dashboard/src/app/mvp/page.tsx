'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import KanbanBoard from '@/features/kanban/KanbanBoard'
import type { Profile } from '@/features/kanban/types'

export default function KanbanMvpPage() {
  const router = useRouter()
  const user = useSupabaseUser({
    requireUser: true,
    onUnauthenticated: () => router.replace('/login')
  })
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data as Profile)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [user])

  if (loading || !user || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading Kanban Board...
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', padding: '1rem' }}>
      <KanbanBoard 
        groupId={profile.group_id || 'default-mvp-group'} 
        profile={profile} 
      />
    </main>
  )
}
