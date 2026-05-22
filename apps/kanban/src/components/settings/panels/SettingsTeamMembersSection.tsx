'use client'

import Image from 'next/image'
import { Eye, Shield, User, UserMinus } from 'lucide-react'
import type { SettingsPageViewModel } from '../settings-types'
import { canKickTarget, canManageTeamSettings } from '@/lib/team/rbac'

export function SettingsTeamMembersSection({ vm }: { vm: SettingsPageViewModel }) {
  const { profile, teamMembers, isEncrypted, updatingGroup, handleToggleEncryption, handleKickUser } = vm

  if (!profile?.group_id) {
    return (
      <section className="teams-members">
        <p style={{ padding: '1rem 0', textAlign: 'left', color: 'var(--text-sub)', margin: 0 }}>
          Join or switch to a team above to manage members and visibility.
        </p>
      </section>
    )
  }

  return (
    <section className="teams-members" aria-labelledby="teams-members-heading">
      <div className="teams-members__head">
        <div>
          <h3 id="teams-members-heading">Team members</h3>
          <p>Remove collaborators or change whether your team is visible to others.</p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            background: isEncrypted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            borderRadius: '12px',
            border: `1px solid ${isEncrypted ? 'var(--error)' : 'var(--success)'}`,
          }}
        >
          {isEncrypted ? <Shield size={18} color="var(--error)" /> : <Eye size={18} color="var(--success)" />}
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isEncrypted ? 'var(--error)' : 'var(--success)' }}>
            {isEncrypted ? 'Private team' : 'Public team'}
          </span>
          <button
            type="button"
            onClick={handleToggleEncryption}
            disabled={updatingGroup || !canManageTeamSettings(profile?.role)}
            className="teams-switch-btn teams-switch-btn--ghost"
            style={{ minHeight: 36, padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
          >
            Toggle visibility
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {teamMembers.map((member) => (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              background: 'var(--bg-sub)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt=""
                    fill
                    sizes="40px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <User size={20} style={{ margin: '10px' }} aria-hidden />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{member.full_name || 'Anonymous'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {member.role}
                </div>
              </div>
            </div>

            {member.id !== profile?.id && canKickTarget(profile?.role, member.role) ? (
              <button
                type="button"
                onClick={() => handleKickUser(member.id)}
                className="teams-switch-btn teams-switch-btn--leave"
                style={{ minHeight: 40, padding: '0.45rem 0.85rem', fontSize: '0.8rem', flexShrink: 0 }}
              >
                <UserMinus size={16} aria-hidden /> Remove
              </button>
            ) : member.id === profile?.id ? (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)', fontWeight: 800, flexShrink: 0 }}>You</span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
