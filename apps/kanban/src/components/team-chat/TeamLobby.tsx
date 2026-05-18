'use client'

import { ExternalLink } from 'lucide-react'
import { Profile } from '@/types/auth'
import RemoteAvatar from '@/components/common/RemoteAvatar'

export function TeamLobby({
  showLobby,
  groupMembers,
  userId,
  onViewProfile,
}: {
  showLobby: boolean
  groupMembers: Profile[]
  userId: string
  onViewProfile: (memberId: string) => void
}) {
  if (!showLobby) return null

  return (
    <div style={{
      position: 'absolute', top: '54px', left: 0, right: 0, bottom: 0,
      background: 'var(--surface)', zIndex: 100, display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.3s ease-out',
    }}
    >
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-sub)' }}>
        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-sub)' }}>Group Active Members</h4>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groupMembers.map((member) => (
            <div
              key={member.id}
              style={{
                background: 'var(--bg-sub)', padding: '0.8rem', borderRadius: '18px',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                gap: '1rem', transition: 'all 0.2s',
              }}
              className="lobby-card"
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '14px', background: 'var(--brand)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900,
              }}
              >
                <RemoteAvatar
                  src={member.avatar_url}
                  alt={`${member.full_name ?? 'Member'} avatar`}
                  size={42}
                  fallback={member.full_name?.charAt(0) ?? '?'}
                  style={{ borderRadius: '14px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{member.id === userId ? 'You' : member.full_name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 600 }}>{member.role || 'Member'}</div>
              </div>
              <button
                onClick={() => onViewProfile(member.id)}
                style={{
                  background: 'var(--brand)', color: 'white', border: 'none',
                  borderRadius: '10px', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label={`Open profile for ${member.full_name ?? 'member'}`}
              >
                <ExternalLink size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
