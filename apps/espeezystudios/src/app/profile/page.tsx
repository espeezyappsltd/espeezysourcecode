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
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', username: '', biography: '' })
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      setUser(authUser)
      if (authUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setProfile(data)
        if (data) {
          setForm({
            full_name: data.full_name ?? '',
            username: data.username ?? '',
            biography: data.biography ?? '',
          })
        }
      }
      setLoading(false)
    }
    void fetchProfile()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setStatus(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim() || null,
        username: form.username.trim() || null,
        biography: form.biography.trim() || null,
      })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setStatus('Profile saved — synced with Kanban & Games.')
    setEditing(false)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }

  return (
    <StudioPageShell title="Profile" description="Your studio account — update fields shared across Espeezy apps.">
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

          {editing ? (
            <form onSubmit={(e) => void handleSave(e)} className="studio-profile-form">
              <label className="studio-crud__field">
                <span>Full name</span>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              </label>
              <label className="studio-crud__field">
                <span>Username</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </label>
              <label className="studio-crud__field">
                <span>Bio</span>
                <textarea
                  value={form.biography}
                  rows={4}
                  onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))}
                />
              </label>
              <div className="studio-crud__modal-actions">
                <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="studio-btn" disabled={saving}>
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <span className="studio-label">Full name</span>
                <p>{profile?.full_name || '—'}</p>
              </div>
              <div>
                <span className="studio-label">Username</span>
                <p>{profile?.username ? `@${profile.username}` : '—'}</p>
              </div>
              <div>
                <span className="studio-label">Bio</span>
                <p>{profile?.biography || '—'}</p>
              </div>
              <button type="button" className="studio-btn" onClick={() => setEditing(true)}>
                Edit profile
              </button>
            </>
          )}

          <div>
            <span className="studio-label">Joined</span>
            <p>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>

          {status ? <p className="studio-success">{status}</p> : null}
        </div>
      )}
    </StudioPageShell>
  )
}
