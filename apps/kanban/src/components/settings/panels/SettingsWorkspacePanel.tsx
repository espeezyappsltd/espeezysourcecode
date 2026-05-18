'use client'

import { CheckCircle2, Eye, Search, X } from 'lucide-react'
import { Profile } from '@/types/auth'
import type { SettingsPageViewModel } from '../settings-types'

export function SettingsWorkspacePanel({ vm }: { vm: SettingsPageViewModel }) {
  const {
    profile,
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
  } = vm

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Workspace Management</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>Switch between project teams or manage your group affiliation.</p>

      <div
        style={{
          background: 'var(--bg-sub)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {(() => {
          type GroupSummary = { name?: string | null; module_code?: string | null }
          const groupRelation = (profile as Profile & { groups?: GroupSummary | GroupSummary[] }).groups
          let groupData: GroupSummary | null = null
          if (Array.isArray(groupRelation)) {
            groupData = groupRelation.length > 0 ? groupRelation[0] : null
          } else if (groupRelation && typeof groupRelation === 'object') {
            groupData = groupRelation
          }
          return (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>Current Team</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{groupData?.name || 'No team assigned'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>{groupData?.module_code || 'Independent'}</div>
            </div>
          )
        })()}
        {profile?.group_id && (
          <button
            type="button"
            onClick={() => handleSwitchGroup(null)}
            disabled={switching}
            className="btn"
            style={{ width: 'auto', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}
          >
            Leave Team
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Other Teams</h3>
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
          <input
            type="text"
            placeholder="Filter teams..."
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '10px',
              background: 'var(--bg-sub)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
            }}
          />
          {groupSearch && (
            <button type="button" onClick={() => setGroupSearch('')} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {availableGroups
          .filter((g) => g.id !== profile?.group_id)
          .filter(
            (g) =>
              g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
              (g.module_code?.toLowerCase() || '').includes(groupSearch.toLowerCase()),
          )
          .map((group) => {
            const isPending = pendingRequests.includes(group.id)
            const isSent = sentRequests.includes(group.id)

            const handleQuickRequest = async () => {
              if (isPending || isSent) return
              setPendingRequests((prev) => [...prev, group.id])
              try {
                const { sendJoinRequest } = await import('@/app/join/actions')
                await sendJoinRequest(group.id, fullName || 'A student')
                setSentRequests((prev) => [...new Set([...prev, group.id])])
              } catch (err: unknown) {
                setError(`Request failed: ${getErrorMessage(err, 'unknown request error')}`)
              } finally {
                setPendingRequests((prev) => prev.filter((id) => id !== group.id))
              }
            }

            return (
              <div
                key={group.id}
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-sub)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{group.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 700 }}>{group.module_code}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleQuickRequest}
                    disabled={isPending || isSent}
                    className={isSent ? 'btn btn-ghost' : 'btn btn-secondary'}
                    style={{
                      width: 'auto',
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      opacity: isSent ? 0.7 : 1,
                      fontSize: isSent ? '0.75rem' : '0.85rem',
                    }}
                  >
                    {isPending ? <div className="spinner-mini" /> : isSent ? <CheckCircle2 size={16} color="var(--success)" /> : null}
                    {isPending ? 'Sending...' : isSent ? 'Request sent. Waiting for team leader approval' : 'Request'}
                  </button>
                  <button type="button" onClick={() => (window.location.href = `/analytics/${group.id}`)} className="btn btn-ghost" style={{ width: 'auto', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Preview Analytics">
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
