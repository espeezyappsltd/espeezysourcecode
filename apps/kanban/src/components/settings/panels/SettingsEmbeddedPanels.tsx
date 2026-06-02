'use client'

import ActivityLogView from '@/components/ActivityLogView'
import ActiveUsersList from '@/components/ActiveUsersList'
import TeamChatShell from '@/components/TeamChatShell'
import type { SettingsPageViewModel } from '../settings-types'

export function SettingsIntercomPanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile } = vm
  if (!profile) return null

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Team chat</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>
        Real-time messages with your project team. Same channel as the board sidebar.
      </p>
      <TeamChatShell />
    </div>
  )
}

export function SettingsActivityPanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile } = vm
  if (!profile) return null

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Activity Log</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>
        Team updates, task changes, and account activity — downloadable anytime.
      </p>
      <ActivityLogView
        userId={profile.id}
        groupId={profile.group_id ?? undefined}
        scope="combined"
        limit={200}
        showExport
      />
    </div>
  )
}

export function SettingsPresencePanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile } = vm
  if (!profile?.group_id) return null

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Live Team Activity</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>
        Real-time awareness of your collaborators and recently seen members.
      </p>
      <ActiveUsersList groupId={profile.group_id} currentUser={profile} />
    </div>
  )
}
