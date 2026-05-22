'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight, CheckCircle2, Eye, Search, Users, X } from 'lucide-react'
import { Profile } from '@/types/auth'
import type { SettingsPageViewModel } from '../settings-types'
import { SettingsTeamMembersSection } from './SettingsTeamMembersSection'
import '../settings-team.css'

function resolveCurrentGroup(profile: Profile | null) {
  type GroupSummary = { name?: string | null; module_code?: string | null }
  const groupRelation = (profile as Profile & { groups?: GroupSummary | GroupSummary[] })?.groups
  if (Array.isArray(groupRelation)) {
    return groupRelation.length > 0 ? groupRelation[0] : null
  }
  if (groupRelation && typeof groupRelation === 'object') {
    return groupRelation
  }
  return null
}

export function SettingsTeamsPanel({ vm }: { vm: SettingsPageViewModel }) {
  const {
    profile,
    isAdmin,
    availableGroups,
    groupSearch,
    setGroupSearch,
    handleSwitchGroup,
    switching,
    fullName,
    pendingRequests,
    setPendingRequests,
    sentRequests,
    setSentRequests,
    setError,
    getErrorMessage,
    addToast,
  } = vm

  const [joinMessageByGroup, setJoinMessageByGroup] = useState<Record<string, string>>({})

  const currentGroup = resolveCurrentGroup(profile)
  const archivedId =
    typeof profile?.archived_group_id === 'string' ? profile.archived_group_id : null
  const archivedGroup = useMemo(
    () => (archivedId ? availableGroups.find((g) => g.id === archivedId) : null),
    [archivedId, availableGroups],
  )

  const browseTeams = availableGroups
    .filter((g) => g.id !== profile?.group_id && g.id !== archivedId)
    .filter(
      (g) =>
        g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
        (g.module_code?.toLowerCase() || '').includes(groupSearch.toLowerCase()),
    )

  return (
    <div className="auth-card teams-settings" style={{ maxWidth: '100%' }}>
      <header className="teams-settings__intro">
        <h2>Teams</h2>
        <p>
          You work in one active team at a time. Switching is instant — your current board is saved, and you can return
          to a previous team with one tap.
        </p>
        <div className="teams-settings__steps" aria-label="How team switching works">
          <div className="teams-settings__step">
            <strong>1. Active</strong>
            The team you see on the board right now.
          </div>
          <div className="teams-settings__step">
            <strong>2. Switch back</strong>
            Return to a team you left — your tasks come back.
          </div>
          <div className="teams-settings__step">
            <strong>3. New team</strong>
            Request access; the lead approves you in.
          </div>
        </div>
      </header>

      <div className="teams-switch-grid">
        <article
          className={`teams-switch-card${profile?.group_id ? ' teams-switch-card--active' : ''}`}
          aria-current={profile?.group_id ? 'true' : undefined}
        >
          <span className="teams-switch-card__badge">Active team</span>
          <h3 className="teams-switch-card__name">{currentGroup?.name || 'No team yet'}</h3>
          <p className="teams-switch-card__meta">{currentGroup?.module_code || 'Independent'}</p>
          <p className="teams-switch-card__hint">
            {profile?.group_id
              ? 'This is the board and chat you see across Espeezy.'
              : 'Create a team from the home screen or request one below.'}
          </p>
          {profile?.group_id && (
            <div className="teams-switch-card__actions">
              <button
                type="button"
                className="teams-switch-btn teams-switch-btn--leave"
                disabled={switching}
                onClick={() => handleSwitchGroup(null)}
              >
                Leave team
              </button>
            </div>
          )}
        </article>

        {archivedGroup && archivedId && archivedId !== profile?.group_id && (
          <article className="teams-switch-card teams-switch-card--return">
            <span className="teams-switch-card__badge">Switch back</span>
            <h3 className="teams-switch-card__name">{archivedGroup.name}</h3>
            <p className="teams-switch-card__meta">{archivedGroup.module_code || 'Previous team'}</p>
            <p className="teams-switch-card__hint">
              One tap restores this team&apos;s board and your saved tasks.
            </p>
            <div className="teams-switch-card__actions">
              <button
                type="button"
                className="teams-switch-btn teams-switch-btn--primary"
                disabled={switching}
                onClick={() => handleSwitchGroup(archivedId, archivedGroup.name)}
              >
                <ArrowLeftRight size={16} aria-hidden />
                {switching ? 'Switching…' : `Switch to ${archivedGroup.name}`}
              </button>
            </div>
          </article>
        )}
      </div>

      <section aria-labelledby="teams-browse-heading">
        <div className="teams-browse__head">
          <h3 id="teams-browse-heading">Join another team</h3>
          <div className="teams-browse__search">
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-sub)',
                pointerEvents: 'none',
              }}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search teams…"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              aria-label="Filter teams"
            />
            {groupSearch && (
              <button
                type="button"
                onClick={() => setGroupSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-sub)',
                  cursor: 'pointer',
                  display: 'flex',
                  minHeight: 44,
                  minWidth: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {browseTeams.length === 0 ? (
          <p className="teams-settings__empty" style={{ textAlign: 'left', padding: '0.5rem 0', color: 'var(--text-sub)' }}>
            {groupSearch ? 'No teams match your search.' : 'You are already viewing all teams you can switch to.'}
          </p>
        ) : (
          <div className="teams-browse-grid">
            {browseTeams.map((group) => {
              const isPending = pendingRequests.includes(group.id)
              const isSent = sentRequests.includes(group.id)

              const handleQuickRequest = async () => {
                if (isPending || isSent) return
                setPendingRequests((prev) => [...prev, group.id])
                try {
                  const { sendJoinRequest } = await import('@/app/join/actions')
                  const res = await sendJoinRequest(
                    group.id,
                    fullName || 'A student',
                    joinMessageByGroup[group.id] ?? null,
                  )
                  if (!res.success) {
                    setError(res.error)
                    addToast('Join request failed', res.error, 'error')
                    return
                  }
                  setSentRequests((prev) => [...new Set([...prev, group.id])])
                  if (res.alreadyPending) {
                    addToast('Already requested', 'Waiting for the team lead to approve.', 'info')
                  } else {
                    addToast(
                      'Request sent',
                      res.chatPosted
                        ? 'Team lead notified in team chat.'
                        : 'The team lead can approve you in the dashboard.',
                      'success',
                    )
                  }
                } catch (err: unknown) {
                  const msg = getErrorMessage(err, 'Could not send join request')
                  setError(msg)
                  addToast('Join request failed', msg, 'error')
                } finally {
                  setPendingRequests((prev) => prev.filter((id) => id !== group.id))
                }
              }

              return (
                <div key={group.id} className="teams-browse-card">
                  <div className="teams-browse-card__row">
                    <div>
                      <div className="teams-browse-card__name">{group.name}</div>
                      <div className="teams-browse-card__code">{group.module_code}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={handleQuickRequest}
                        disabled={isPending || isSent}
                        className={`teams-switch-btn ${isSent ? 'teams-switch-btn--ghost' : 'teams-switch-btn--primary'}`}
                        style={{ minHeight: 40, fontSize: isSent ? '0.72rem' : '0.82rem' }}
                      >
                        {isPending ? (
                          <span className="spinner-mini" aria-hidden />
                        ) : isSent ? (
                          <CheckCircle2 size={16} color="var(--success)" aria-hidden />
                        ) : null}
                        {isPending ? 'Sending…' : isSent ? 'Pending approval' : 'Request to join'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/analytics/${group.id}`
                        }}
                        className="teams-switch-btn teams-switch-btn--ghost"
                        style={{ minHeight: 40, width: 40, padding: 0 }}
                        title="Preview team"
                        aria-label={`Preview ${group.name}`}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                  {!isSent && (
                    <textarea
                      placeholder="Optional note for the team lead…"
                      value={joinMessageByGroup[group.id] ?? ''}
                      onChange={(e) =>
                        setJoinMessageByGroup((prev) => ({
                          ...prev,
                          [group.id]: e.target.value.slice(0, 500),
                        }))
                      }
                      disabled={isPending}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-main)',
                        fontSize: '0.8rem',
                        resize: 'vertical',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {isAdmin && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 700 }}>
            <Users size={16} aria-hidden />
            Admin tools
          </div>
          <SettingsTeamMembersSection vm={vm} />
        </>
      )}
    </div>
  )
}
