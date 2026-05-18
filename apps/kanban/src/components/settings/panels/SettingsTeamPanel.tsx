'use client'

import Image from 'next/image'
import { Eye, Shield, User, UserMinus } from 'lucide-react'
import type { SettingsPageViewModel } from '../settings-types'

export function SettingsTeamPanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile, teamMembers, isEncrypted, updatingGroup, handleToggleEncryption, handleKickUser } = vm

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Team Management</h2>
          <p style={{ color: 'var(--text-sub)' }}>Manage collaborators and group visibility settings.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', background: isEncrypted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: `1px solid ${isEncrypted ? 'var(--error)' : 'var(--success)'}` }}>
          {isEncrypted ? <Shield size={18} color="var(--error)" /> : <Eye size={18} color="var(--success)" />}
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isEncrypted ? 'var(--error)' : 'var(--success)' }}>
            {isEncrypted ? 'VISIBILITY: ENCRYPTED' : 'VISIBILITY: PUBLIC'}
          </span>
          <button
            type="button"
            onClick={handleToggleEncryption}
            disabled={updatingGroup}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              marginLeft: '0.5rem',
            }}
          >
            Toggle
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {teamMembers.map((member) => (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              background: 'var(--bg-sub)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', overflow: 'hidden', position: 'relative' }}>
                {member.avatar_url ? (
                  <Image src={member.avatar_url} alt={`${member.full_name || 'Team'} avatar`} fill sizes="40px" style={{ objectFit: 'cover' }} unoptimized />
                ) : (
                  <User size={20} style={{ margin: '10px' }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{member.full_name || 'Anonymous'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase' }}>{member.role}</div>
              </div>
            </div>

            {member.id !== profile?.id && member.role !== 'admin' && (
              <button
                type="button"
                onClick={() => handleKickUser(member.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--error)',
                  border: '1px solid var(--error)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                <UserMinus size={16} /> Kick
              </button>
            )}
            {member.id === profile?.id && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 700 }}>YOU</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
