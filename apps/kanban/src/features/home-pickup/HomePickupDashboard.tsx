'use client'

import Image from 'next/image'
import { ArrowRight, CheckCircle2, LayoutDashboard, ListTodo, Users } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useDashboardMetrics } from '@/context/DashboardMetricsContext'
import { usePresence } from '@/components/PresenceProvider'
import { countTeamMembersOnline } from '@/lib/presence/team-presence'
import { canManageJoinRequests } from '@/lib/team/rbac'
import { getPlanName } from '@/utils/feature-gate'
import type { Profile } from '@/types/auth'
import './home-pickup.css'

type Props = {
  workspaceReady: boolean
  canEnter: boolean
  exiting: boolean
  onEnter: () => void
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function initials(profile: Profile | null): string {
  const name = profile?.full_name?.trim() || profile?.email || '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function loadPercent(workspaceReady: boolean, canEnter: boolean): number {
  if (workspaceReady) return 100
  if (canEnter) return 85
  return 45
}

export function HomePickupDashboard({
  workspaceReady,
  canEnter,
  exiting,
  onEnter,
}: Props) {
  const { profile } = useProfile()
  const {
    group,
    members,
    personalTaskCount,
    totalBacklog,
    projectProgress,
    progressLabel,
    pendingRequests,
  } = useDashboardMetrics()
  const { onlineUsers, globalOnlineCount } = usePresence()
  const teamOnlineCount = countTeamMembersOnline(members.map((m) => m.id), onlineUsers)

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const teamName = group?.name || 'Your team'
  const moduleCode = group?.module_code || 'Project workspace'
  const plan = profile?.subscription_plan
  const planLabel = plan && plan !== 'free' ? getPlanName(plan) : null
  const percent = loadPercent(workspaceReady, canEnter)

  const resumeItems: string[] = []
  if (personalTaskCount > 0) {
    resumeItems.push(`You have ${personalTaskCount} task${personalTaskCount === 1 ? '' : 's'} assigned to you.`)
  }
  if (totalBacklog > 0) {
    resumeItems.push(`${totalBacklog} open item${totalBacklog === 1 ? '' : 's'} remain on the team backlog.`)
  }
  if (projectProgress > 0) {
    resumeItems.push(`Team progress is at ${projectProgress}% — ${progressLabel.toLowerCase()}.`)
  }
  if (pendingRequests.length > 0 && canManageJoinRequests(profile?.role)) {
    resumeItems.push(`${pendingRequests.length} teammate${pendingRequests.length === 1 ? '' : 's'} waiting to join.`)
  }
  if (resumeItems.length === 0) {
    resumeItems.push('Your board is ready — pick a column and add your first task.')
  }

  return (
    <section
      className={`home-pickup-overlay${exiting ? ' home-pickup-overlay--exit' : ''}`}
      aria-label="Workspace overview"
      aria-busy={!workspaceReady}
    >
      <header className="home-pickup-hero">
        <div className="home-pickup-identity">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={56}
              height={56}
              className="home-pickup-avatar"
              unoptimized
            />
          ) : (
            <div className="home-pickup-avatar home-pickup-avatar-fallback" aria-hidden>
              {initials(profile)}
            </div>
          )}
          <div>
            <p className="home-pickup-eyebrow">Your workspace</p>
            <h1 className="home-pickup-title">
              {greeting()}, {firstName}
            </h1>
            {planLabel && (
              <span
                className="locked-badge locked-badge-premium"
                style={{ marginTop: '0.35rem', display: 'inline-block' }}
              >
                {planLabel}
              </span>
            )}
            <p className="home-pickup-lead">
              Here is where you left off on <strong style={{ color: 'var(--text-main)' }}>{teamName}</strong>
              {moduleCode ? ` (${moduleCode})` : ''}. Your full board is loading in the background.
            </p>
          </div>
        </div>
      </header>

      <div className="home-pickup-grid" role="list">
        <article className="home-pickup-card" role="listitem">
          <p className="home-pickup-card-label">Team</p>
          <p className="home-pickup-card-value">{teamName}</p>
          <p className="home-pickup-card-hint">{moduleCode}</p>
        </article>
        <article className="home-pickup-card" role="listitem">
          <p className="home-pickup-card-label">
            <ListTodo size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
            Your tasks
          </p>
          <p className="home-pickup-card-value">{personalTaskCount}</p>
          <p className="home-pickup-card-hint">Assigned to you</p>
        </article>
        <article className="home-pickup-card" role="listitem">
          <p className="home-pickup-card-label">Backlog</p>
          <p className="home-pickup-card-value">{totalBacklog}</p>
          <p className="home-pickup-card-hint">Open across the team</p>
        </article>
        <article className="home-pickup-card" role="listitem">
          <p className="home-pickup-card-label">
            <Users size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
            Roster
          </p>
          <p className="home-pickup-card-value" data-testid="pickup-roster-online-count">
            {globalOnlineCount} on Espeezy · {teamOnlineCount} on team
          </p>
          <p className="home-pickup-card-hint">{members.length || 0} on the team</p>
        </article>
      </div>

      <aside className="home-pickup-resume" aria-labelledby="pickup-resume-heading">
        <h2 id="pickup-resume-heading">Pick up where you left off</h2>
        <ul>
          {resumeItems.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </aside>

      <footer className="home-pickup-footer">
        <div className="home-pickup-progress-track">
          <div className="home-pickup-progress-label">
            <span>{workspaceReady ? 'Board ready' : 'Preparing your Kanban board…'}</span>
            <span>{workspaceReady ? '100%' : `${percent}%`}</span>
          </div>
          <div
            className="home-pickup-progress-bar"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`home-pickup-progress-fill${workspaceReady ? '' : ' home-pickup-progress-fill--pulse'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="home-pickup-actions">
          <button
            type="button"
            className="btn btn-primary btn-inline"
            onClick={onEnter}
            disabled={!canEnter}
            aria-describedby={canEnter && !workspaceReady ? 'pickup-enter-hint' : undefined}
          >
            <LayoutDashboard size={16} aria-hidden />
            {workspaceReady ? 'Enter workspace' : 'Loading workspace…'}
            <ArrowRight size={14} aria-hidden />
          </button>
          {canEnter && !workspaceReady && (
            <span id="pickup-enter-hint" style={{ fontSize: '0.75rem', color: 'var(--text-sub)', alignSelf: 'center' }}>
              You can enter while the board finishes syncing
            </span>
          )}
          {workspaceReady && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                color: 'var(--success)',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={14} aria-hidden />
              Ready
            </span>
          )}
        </div>
      </footer>
    </section>
  )
}
