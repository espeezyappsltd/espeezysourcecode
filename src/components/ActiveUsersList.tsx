'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { usePresence } from './PresenceProvider'
import { User, Shield } from 'lucide-react'
import { ActiveUser } from '@/types/auth'
import { getFlagComponent } from '@/utils/geo'

export default function ActiveUsersList({
  groupId,
  currentUser
}: {
  groupId: string
  currentUser: { id: string }
}) {
  const [members, setMembers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const { onlineUsers, typingUsers } = usePresence()

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('profiles')
      .select('id, full_name, avatar_url, role, last_seen, country_code')
      .eq('group_id', groupId)
      .order('last_seen', { ascending: false })

    setMembers((data ?? []) as ActiveUser[])
    setLoading(false)
  }, [groupId, db])

  useEffect(() => {
    void (async () => {
      await fetchMembers()
    })()

    const channel = db.channel(`presence_list_${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `group_id=eq.${groupId}` },
        () => {
          void fetchMembers()
        }
      )
      .subscribe()

    return () => {
      db.removeChannel(channel)
    }
  }, [fetchMembers, groupId, db])

  const formatLastSeen = useCallback((timestamp: string | null) => {
    if (!timestamp) return 'Never'

    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Seconds ago'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }, [])

  if (loading && members.length === 0) {
    return (
      <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
        Loading pulse...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {members.map((member) => {
        const isOnline = onlineUsers.has(member.id)
        const isTyping = typingUsers.has(member.id)
        const isMe = member.id === currentUser.id

        return (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: 'var(--bg-main)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              opacity: isOnline ? 1 : 0.7,
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name ? `${member.full_name}'s avatar` : 'User avatar'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={24} color="var(--text-sub)" />
                  )}
                </div>
                {isOnline && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: 'var(--success)',
                      border: '2px solid var(--bg-main)',
                      boxShadow: '0 0 8px var(--success)'
                    }}
                  />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {member.full_name} {isMe && '(You)'}
                    {(() => {
                      const Flag = getFlagComponent((member as { country_code?: string }).country_code)
                      return Flag ? <div style={{ width: '16px', height: '11px', borderRadius: '2px', overflow: 'hidden' }}><Flag /></div> : null
                    })()}
                  </span>
                  {member.role === 'admin' && <Shield size={14} color="var(--brand)" />}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: isTyping ? 'var(--brand)' : 'var(--text-sub)',
                    fontWeight: isTyping ? 700 : 500
                  }}
                >
                  {isTyping ? (
                    <span style={{ fontStyle: 'italic' }}>is typing...</span>
                  ) : isOnline ? (
                    'Online now'
                  ) : (
                    `Last active ${formatLastSeen(member.last_seen ?? null)}`
                  )}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-sub)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 800
                }}
              >
                Role
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand)' }}>
                {member.role ? member.role.toUpperCase() : 'Member'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
