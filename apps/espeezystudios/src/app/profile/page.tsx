'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import StudioPageShell from '../../components/StudioPageShell'
import Link from 'next/link'

type Profile = {
  id: string
  full_name?: string | null
  username?: string | null
  biography?: string | null
  created_at?: string | null
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      if (authUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setProfile(data)
      }
      setLoading(false)
    }
    void fetchProfile()
  }, [])

  return (
    <StudioPageShell title="Profile" description="Your studio account and public profile fields.">
      {loading && <p className="studio-muted">Loading…</p>}
      {!loading && !user && (
        <div className="studio-card">
          <p>Not signed in.</p>
          <Link href="/login" className="studio-link">
            Go to login
          </Link>
        </div>
      )}
      {!loading && user && (
        <div className="studio-card studio-profile-grid">
          <div>
            <span className="studio-label">Email</span>
            <p>{user.email}</p>
          </div>
          <div>
            <span className="studio-label">User ID</span>
            <p className="studio-mono">{user.id}</p>
          </div>
          {profile?.full_name && (
            <div>
              <span className="studio-label">Full name</span>
              <p>{profile.full_name}</p>
            </div>
          )}
          {profile?.username && (
            <div>
              <span className="studio-label">Username</span>
              <p>@{profile.username}</p>
            </div>
          )}
          {profile?.biography && (
            <div>
              <span className="studio-label">Bio</span>
              <p>{profile.biography}</p>
            </div>
          )}
          <div>
            <span className="studio-label">Joined</span>
            <p>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : 'Unknown'}
            </p>
          </div>
        </div>
      )}
    </StudioPageShell>
  )
}
