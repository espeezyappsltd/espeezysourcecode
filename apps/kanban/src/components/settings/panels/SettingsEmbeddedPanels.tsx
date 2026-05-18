'use client'

import ActivityLogView from '@/components/ActivityLogView'
import ActiveUsersList from '@/components/ActiveUsersList'
import EmailCenter from '@/components/EmailCenter'
import type { SettingsPageViewModel } from '../settings-types'

export function SettingsIntercomPanel({ vm }: { vm: SettingsPageViewModel }) {
  const { profile, teamMembers } = vm
  if (!profile) return null

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Direct Intercom & Mail</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>
        Management hub for automated reminders and verifiable PDF reports.
      </p>
      <EmailCenter groupId={profile.group_id || ''} profile={profile} teamMembers={teamMembers} />
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
        A complete history of your account actions and project updates.
      </p>
      <ActivityLogView userId={profile.id} />
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
