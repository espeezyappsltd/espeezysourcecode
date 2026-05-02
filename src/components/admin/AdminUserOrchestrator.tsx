'use client'

/**
 * AdminUserOrchestrator
 *
 * The "Identity Orchestrator" panel — a list of recent users with
 * per-row action buttons to upgrade, ban, or unlock a user.
 *
 * Props:
 *   users        — array of recent user profiles
 *   loading      — true while data is still being fetched
 *   onUserAction — called when an action button is clicked
 *
 * Internal sub-components:
 *   UserRow     — renders a single user card
 *   ActionButton — a small square icon button with hover states
 */

import { ArrowRight, UserCheck, UserMinus, Search } from 'lucide-react'
import type { RecentUser } from './types'

interface Props {
  users: RecentUser[]
  loading: boolean
  onUserAction: (userId: string, action: 'unlock' | 'upgrade' | 'ban') => void
}

export default function AdminUserOrchestrator({
  users,
  loading,
  onUserAction,
}: Props) {
  return (
    <div
      style={{
        padding: '2.5rem',
        background: '#0a0a0a',
        border: '1px solid #111',
        borderRadius: '32px',
      }}
    >
      {/* ── Header row ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 950, margin: 0, color: 'white' }}>
          Identity Orchestrator
        </h2>

        {/* Search input — visual only; filtering is out of scope for this component */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.3,
              color: 'white',
            }}
          />
          <input
            type="search"
            placeholder="Search Node..."
            aria-label="Search users"
            style={{
              padding: '0.6rem 1rem 0.6rem 2.5rem',
              background: '#000',
              border: '1px solid #222',
              borderRadius: '12px',
              color: 'white',
              fontSize: '0.8rem',
            }}
          />
        </div>
      </div>

      {/* ── User list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="animate-pulse" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Accessing Decentralized Ledger...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {users.map((user) => (
            <UserRow key={user.id} user={user} onAction={onUserAction} />
          ))}
        </div>
      )}

      {/* ── CSS for action buttons ─────────────────────────────────────────
          These styles live here (not in JSX) but are still scoped to this
          component because they use class names unique to this panel.
          If you move ActionButton to a shared file, move these too.
      ─────────────────────────────────────────────────────────────────── */}
      <style jsx>{`
        .action-btn {
          width: 40px;
          height: 40px;
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
          cursor: pointer;
        }
        .action-btn:hover {
          background: #161616;
          color: #10b981;
          border-color: #10b981;
        }
        .action-btn.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: #ef4444;
        }
      `}</style>
    </div>
  )
}

// ── Internal sub-components ────────────────────────────────────────────────────

/** Renders one user card with conditional action buttons. */
function UserRow({
  user,
  onAction,
}: {
  user: RecentUser
  onAction: (userId: string, action: 'unlock' | 'upgrade' | 'ban') => void
}) {
  const isBanned = user.role === 'banned'
  const initial = user.full_name?.[0]?.toUpperCase() ?? 'S'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1.25rem',
        border: '1px solid #111',
        borderRadius: '16px',
        background: '#000',
      }}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        style={{
          width: '44px',
          height: '44px',
          background: '#111',
          borderRadius: '12px',
          marginRight: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          color: '#10b981',
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, color: 'white' }}>{user.full_name}</div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {user.email}
          {isBanned && (
            <span style={{ color: '#ef4444', fontWeight: 900 }}>[BANNED]</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {isBanned ? (
          <ActionButton
            onClick={() => onAction(user.id, 'unlock')}
            className="action-btn"
            title="Unlock Account"
            icon={<UserCheck size={18} />}
          />
        ) : (
          <>
            <ActionButton
              onClick={() => onAction(user.id, 'upgrade')}
              className="action-btn"
              title="Elevate to Premium"
              icon={<ArrowRight size={18} />}
            />
            <ActionButton
              onClick={() => onAction(user.id, 'ban')}
              className="action-btn danger"
              title="Terminate Session"
              icon={<UserMinus size={18} />}
            />
          </>
        )}
      </div>
    </div>
  )
}

/** Small square icon button. `className` carries the CSS hover effects above. */
function ActionButton({
  onClick,
  className,
  title,
  icon,
}: {
  onClick: () => void
  className: string
  title: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={className}
      title={title}
      aria-label={title}
    >
      {icon}
    </button>
  )
}
