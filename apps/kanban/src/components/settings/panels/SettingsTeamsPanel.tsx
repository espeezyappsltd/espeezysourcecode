'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight, CalendarDays, CheckCircle2, Eye, Lock, Pencil, PlusCircle, Save, Search, Trash2, Users, X } from 'lucide-react'
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

function formatCreatedAt(value: string | null | undefined) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
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
    groupMetricsById,
    deletingGroupId,
    updatingOwnedGroupId,
    creatingGroup,
    setError,
    getErrorMessage,
    addToast,
    handleDeleteGroup,
    handleUpdateOwnedGroup,
    handleCreateGroup,
  } = vm

  const [joinMessageByGroup, setJoinMessageByGroup] = useState<Record<string, string>>({})
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editDraftByGroup, setEditDraftByGroup] = useState<
    Record<string, { name: string; description: string; capacity: number; isEncrypted: boolean }>
  >({})

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
        <div className="teams-create-card" aria-labelledby="teams-create-heading">
          <h3 id="teams-create-heading">Create a new team</h3>
          <p>Create and switch to a new team instantly. You become the owner and can edit or delete it later.</p>
          <div className="teams-create-grid">
            <label className="teams-owner-editor__field">
              Team name
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value.slice(0, 120))}
                placeholder="e.g. Growth Product Squad"
                disabled={creatingGroup}
              />
            </label>
            <label className="teams-owner-editor__field">
              Description
              <textarea
                rows={2}
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value.slice(0, 600))}
                placeholder="Optional team purpose, scope, or focus..."
                disabled={creatingGroup}
              />
            </label>
          </div>
          <div className="teams-create-actions">
            <button
              type="button"
              className="teams-switch-btn teams-switch-btn--primary"
              disabled={creatingGroup}
              onClick={async () => {
                const result = await handleCreateGroup({
                  name: createName,
                  description: createDescription,
                })
                if (result.ok) {
                  setCreateName('')
                  setCreateDescription('')
                }
              }}
            >
              {creatingGroup ? <span className="spinner-mini" aria-hidden /> : <PlusCircle size={16} aria-hidden />}
              {creatingGroup ? 'Creating…' : 'Create and switch'}
            </button>
          </div>
        </div>

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
              const metrics = groupMetricsById[group.id]
              const isSent = sentRequests.includes(group.id) || metrics?.hasPendingRequest
              const memberCount = metrics?.memberCount ?? 0
              const capacity = group.capacity ?? 5
              const createdAt = formatCreatedAt(group.created_at)
              const isAtCapacity = memberCount >= capacity
              const canDelete = Boolean(metrics?.canDelete)
              const isDeletingThisGroup = deletingGroupId === group.id
              const isUpdatingThisGroup = updatingOwnedGroupId === group.id
              const isOwner = Boolean(metrics?.isOwner)
              const isEditing = editingGroupId === group.id
              const draft = editDraftByGroup[group.id] ?? {
                name: group.name,
                description: group.description ?? '',
                capacity,
                isEncrypted: group.is_encrypted,
              }

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

              const beginEdit = () => {
                setEditingGroupId(group.id)
                setEditDraftByGroup((prev) => ({
                  ...prev,
                  [group.id]: {
                    name: group.name,
                    description: group.description ?? '',
                    capacity,
                    isEncrypted: group.is_encrypted,
                  },
                }))
              }

              const cancelEdit = () => {
                setEditingGroupId((prev) => (prev === group.id ? null : prev))
              }

              const saveEdit = async () => {
                const trimmedName = draft.name.trim()
                if (!trimmedName) {
                  setError('Team name is required.')
                  return
                }
                if (!Number.isFinite(draft.capacity) || draft.capacity < 1) {
                  setError('Capacity must be at least 1.')
                  return
                }

                const result = await handleUpdateOwnedGroup({
                  groupId: group.id,
                  name: trimmedName,
                  description: draft.description,
                  capacity: draft.capacity,
                  isEncrypted: draft.isEncrypted,
                })
                if (result.ok) {
                  setEditingGroupId((prev) => (prev === group.id ? null : prev))
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
                      {isOwner && !isEditing && (
                        <button
                          type="button"
                          onClick={beginEdit}
                          className="teams-switch-btn teams-switch-btn--ghost"
                          style={{ minHeight: 40, width: 40, padding: 0 }}
                          title="Edit team"
                          aria-label={`Edit ${group.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleQuickRequest}
                        disabled={isPending || isSent || isAtCapacity}
                        className={`teams-switch-btn ${isSent ? 'teams-switch-btn--ghost' : 'teams-switch-btn--primary'}`}
                        style={{ minHeight: 40, fontSize: isSent ? '0.72rem' : '0.82rem' }}
                      >
                        {isPending ? (
                          <span className="spinner-mini" aria-hidden />
                        ) : isSent ? (
                          <CheckCircle2 size={16} color="var(--success)" aria-hidden />
                        ) : null}
                        {isPending
                          ? 'Sending…'
                          : isSent
                            ? 'Pending approval'
                            : isAtCapacity
                              ? 'Team is full'
                              : 'Request to join'}
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
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          disabled={isDeletingThisGroup}
                          className="teams-switch-btn teams-switch-btn--leave"
                          style={{ minHeight: 40, width: 40, padding: 0 }}
                          title="Delete empty team"
                          aria-label={`Delete ${group.name}`}
                        >
                          {isDeletingThisGroup ? <span className="spinner-mini" aria-hidden /> : <Trash2 size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="teams-browse-card__metrics" aria-label={`${group.name} metrics`}>
                    <span className="teams-metric-pill">
                      <Users size={14} aria-hidden />
                      {memberCount}/{capacity} members
                    </span>
                    <span className="teams-metric-pill">
                      <CalendarDays size={14} aria-hidden />
                      Created {createdAt}
                    </span>
                    <span className="teams-metric-pill">
                      <Lock size={14} aria-hidden />
                      {group.is_encrypted ? 'Private' : 'Public'}
                    </span>
                    <span
                      className={`teams-metric-pill ${isAtCapacity ? 'teams-metric-pill--full' : 'teams-metric-pill--open'}`}
                    >
                      {isAtCapacity ? 'Team full' : `${capacity - memberCount} open spot${capacity - memberCount === 1 ? '' : 's'}`}
                    </span>
                  </div>
                  {group.description && (
                    <p className="teams-browse-card__description">{group.description}</p>
                  )}
                  {isOwner && isEditing && (
                    <div className="teams-owner-editor">
                      <label className="teams-owner-editor__field">
                        Team name
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) =>
                            setEditDraftByGroup((prev) => ({
                              ...prev,
                              [group.id]: { ...draft, name: e.target.value.slice(0, 120) },
                            }))
                          }
                          disabled={isUpdatingThisGroup}
                        />
                      </label>
                      <label className="teams-owner-editor__field">
                        Description
                        <textarea
                          rows={2}
                          value={draft.description}
                          onChange={(e) =>
                            setEditDraftByGroup((prev) => ({
                              ...prev,
                              [group.id]: { ...draft, description: e.target.value.slice(0, 600) },
                            }))
                          }
                          disabled={isUpdatingThisGroup}
                        />
                      </label>
                      <div className="teams-owner-editor__row">
                        <label className="teams-owner-editor__field">
                          Capacity
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={draft.capacity}
                            onChange={(e) =>
                              setEditDraftByGroup((prev) => ({
                                ...prev,
                                [group.id]: {
                                  ...draft,
                                  capacity: Math.max(1, Number.parseInt(e.target.value || '1', 10)),
                                },
                              }))
                            }
                            disabled={isUpdatingThisGroup}
                          />
                        </label>
                        <label className="teams-owner-editor__toggle">
                          <input
                            type="checkbox"
                            checked={draft.isEncrypted}
                            onChange={(e) =>
                              setEditDraftByGroup((prev) => ({
                                ...prev,
                                [group.id]: { ...draft, isEncrypted: e.target.checked },
                              }))
                            }
                            disabled={isUpdatingThisGroup}
                          />
                          Private team
                        </label>
                      </div>
                      <div className="teams-owner-editor__actions">
                        <button
                          type="button"
                          className="teams-switch-btn teams-switch-btn--primary"
                          onClick={saveEdit}
                          disabled={isUpdatingThisGroup}
                        >
                          {isUpdatingThisGroup ? <span className="spinner-mini" aria-hidden /> : <Save size={16} />}
                          {isUpdatingThisGroup ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          className="teams-switch-btn teams-switch-btn--ghost"
                          onClick={cancelEdit}
                          disabled={isUpdatingThisGroup}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
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
