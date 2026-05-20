'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import KanbanBoard from './KanbanBoard'
import CalendarView from './CalendarView'
import { LayoutDashboard, Calendar, Activity, Zap, TrendingUp, Users, UserCircle, PartyPopper } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from './NotificationProvider'
import { getPlanName, hasFeature } from '@/utils/feature-gate'
import { useDashboardMetrics } from '@/context/DashboardMetricsContext'
import { usePresence } from '@/components/PresenceProvider'
import { countTeamMembersOnline } from '@/lib/presence/team-presence'
import { canManageJoinRequests } from '@/lib/team/rbac'
import AccountTiersBanner from '@/components/AccountTiersBanner'
import './dashboard-home.css'

const DASHBOARD_TABS = [
  { id: 'board', label: 'Task Board', icon: <LayoutDashboard size={18} /> },
  { id: 'calendar', label: 'Team Calendar', icon: <Calendar size={18} /> },
] as const

export default function DashboardHome({
  groupId,
  onWorkspaceReady,
}: {
  groupId: string
  onWorkspaceReady?: () => void
}) {
  const router = useRouter()
  const { profile } = useProfile()
  const { addToast } = useNotifications()
  const [activeTab, setActiveTab] = useState<'board' | 'calendar'>('board')
  const [mounted, setMounted] = useState(false)

  const greeting = useMemo(() => {
    if (!mounted) return 'Welcome'
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [mounted])

  // 1. Sync local time display and set mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    personalTaskCount,
    group,
    newTaskSignal,
    setNewTaskSignal,
    members,
    pendingRequests,
    showMembers,
    setShowMembers,
    projectProgress,
    progressLabel,
    totalBacklog,
    totalTaskCount,
    allDone,
    handleAcceptRequest,
    handleDeclineRequest,
    setSyncToken,
  } = useDashboardMetrics()

  const { onlineUsers, globalOnlineCount } = usePresence()
  const teamOnlineCount = useMemo(
    () => countTeamMembersOnline(members.map((m) => m.id), onlineUsers),
    [members, onlineUsers],
  )

  const renderRoleBadge = (role: string | null) => {
    const r = role?.toUpperCase()
    if (r === 'TEAM_LEADER' || r === 'ADMIN') return <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--brand)', color: 'white', fontWeight: 900, marginLeft: '4px' }}>{r.replace('_', ' ')}</span>
    if (r === 'MODERATOR') return <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--success)', color: 'white', fontWeight: 900, marginLeft: '4px' }}>MOD</span>
    return null
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="skeleton" style={{ height: '140px', borderRadius: '24px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-title" style={{ width: '40%' }} />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          </div>
          <div className="skeleton" style={{ width: '200px', height: '50px', borderRadius: '14px' }} />
        </div>
        <div className="skeleton" style={{ height: '400px', borderRadius: '24px' }} />
      </div>
    )
  }

  return (
    <div className="page-fade page-shell page-shell--wide page-stack" style={{ paddingBottom: '4rem' }}>

      <AccountTiersBanner />

      {/* ── CONTROL PANEL HEADER ─────────────────────────────────────────── */}
      <header className="page-header dashboard-home-header">
        <div className="page-header__main">

          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {greeting}, {profile?.full_name?.split(' ')[0] || 'User'}
            {profile?.subscription_plan === 'premium' && <span className="locked-badge locked-badge-premium glow-premium" style={{ margin: 0, fontSize: '0.7rem' }}>{getPlanName('premium').toUpperCase()}</span>}
            {profile?.subscription_plan === 'pro' && <span className="locked-badge locked-badge-pro glow-pro" style={{ margin: 0, fontSize: '0.7rem' }}>{getPlanName('pro').toUpperCase()}</span>}
            {profile?.subscription_plan === 'lifetime' && <span className="locked-badge locked-badge-premium glow-premium" style={{ margin: 0, fontSize: '0.7rem' }}>{getPlanName('lifetime').toUpperCase()}</span>}
          </h1>

          <div className="dashboard-home-hud">
            <div className="dashboard-home-hud__team">
              <Zap size={12} color="var(--brand)" fill="var(--brand)" style={{ opacity: 0.8, flexShrink: 0 }} aria-hidden />
              <span style={{ letterSpacing: '0.04em', textTransform: 'uppercase', minWidth: 0 }}>
                TEAM: <span style={{ color: 'var(--brand)' }}>{group?.name || 'STARTING UP...'}</span>
              </span>
              <button
                type="button"
                className="dashboard-home-hud__team-id"
                onClick={() => {
                  navigator.clipboard.writeText(groupId)
                  addToast('ID Copied', 'Team ID has been copied to clipboard.', 'success')
                }}
                title="Copy Team ID"
                id="copy-team-id"
              >
                ID: {groupId.slice(0, 8)}…
              </button>
            </div>

            <div className="dashboard-home-hud__global" data-testid="dashboard-global-online">
              <span className="dashboard-home-hud__global-dot" aria-hidden />
              <span>
                {globalOnlineCount} online on Espeezy
                <span style={{ color: 'var(--text-sub)', fontWeight: 700 }}>
                  {' '}
                  · {teamOnlineCount} on your team
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowMembers(!showMembers)}
              className={`btn dashboard-home-roster-btn${showMembers ? ' btn-primary dashboard-home-roster-btn--open' : ' btn-secondary'}`}
              aria-label={showMembers ? 'Hide Team Roster' : 'Show Team Roster'}
              aria-expanded={showMembers}
            >
              <span className="dashboard-home-roster-btn__label">
                <Users size={16} aria-hidden />
                Team Roster
              </span>
              <span className="dashboard-home-roster-btn__meta" data-testid="team-roster-online-count">
                {teamOnlineCount} online · {members.length || 0} total
                {canManageJoinRequests(profile?.role) && pendingRequests.length > 0
                  ? ` (+${pendingRequests.length} pending)`
                  : ''}
              </span>
            </button>
          </div>

          {showMembers && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1.25rem',
              animation: 'fadeInSlide 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
              background: 'var(--bg-sub)',
              padding: '1.25rem',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              maxWidth: '450px',
              zIndex: 100,
              boxShadow: 'var(--shadow-xl)'
            }}>

              {/* Active Members */}
              <h2 style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                Team members · {teamOnlineCount} online now
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {members.map(m => {
                  const isSelf = m.id === profile?.id
                  const isOnline = onlineUsers.has(m.id)

                  return (
                    <div key={m.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '8px 14px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                      onClick={() => router.push(`/network/profile/${m.id}`)}
                    >
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: 'var(--brand)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                          {m.avatar_url ? <Image src={m.avatar_url} alt={m.full_name || 'avatar'} width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.full_name?.[0]}
                        </div>
                        <div style={{ position: 'absolute', bottom: -1, right: -1, width: '10px', height: '10px', borderRadius: '50%', background: isOnline ? 'var(--success)' : '#94a3b8', border: '2px solid var(--surface)', boxShadow: isOnline ? '0 0 8px var(--success)' : 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--text-main)', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                          {m.full_name?.split(' ')[0]}{isSelf && ' (You)'}
                          {renderRoleBadge(m.role)}
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-sub)', marginTop: '2px' }}>
                          {isOnline ? 'Active Now' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pending Requests Section */}
              {canManageJoinRequests(profile?.role) && pendingRequests.length > 0 && (
                <>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                  <h2 style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Incoming Requests ({pendingRequests.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {pendingRequests.map(r => (
                      <div key={r.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(var(--brand-rgb), 0.03)',
                        border: '1px dashed var(--brand)',
                        borderRadius: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {r.profiles?.avatar_url ? <Image src={r.profiles.avatar_url} alt={r.profiles.full_name || 'avatar'} width={18} height={18} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={18} color="var(--text-sub)" />}
                          </div>
                          <div style={{ fontWeight: 850, fontSize: '0.85rem', color: 'var(--text-main)' }}>{r.profiles?.full_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => handleDeclineRequest(r.id)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--error)', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer' }}>Decline</button>
                          <button onClick={() => handleAcceptRequest(r.id)} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: 'var(--brand)', color: 'white', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer' }}>Accept</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="page-header__actions dashboard-home-header-actions">
          <button
            type="button"
            onClick={() => setNewTaskSignal((prev) => prev + 1)}
            className="btn btn-primary btn-inline"
            aria-label="Create a new task"
          >
            <Zap size={16} fill="currentColor" aria-hidden /> New Task
          </button>
          <button
            type="button"
            onClick={() => router.push(`/analytics/${groupId}`)}
            className="btn btn-secondary btn-inline"
            aria-label="View group updates and progress"
          >
            Group Updates
          </button>
        </div>
      </header>

      {allDone && totalTaskCount > 0 && (
        <div
          className="kanban-all-done-banner"
          role="status"
          data-testid="kanban-all-done-banner"
          aria-live="polite"
        >
          <PartyPopper size={22} aria-hidden />
          <span className="kanban-all-done-banner__title">ALL DONE</span>
          <span className="kanban-all-done-banner__sub">Every team task is complete — great work.</span>
        </div>
      )}

      {/* ── METRICS MODULES ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {[
          { icon: <Activity size={20} />, label: 'Your Goals', value: personalTaskCount, sub: 'Tasks for you to do', color: 'var(--brand)' },
          { icon: <Users size={20} />, label: 'Team Progress', value: totalBacklog, sub: 'Tasks left for the team', color: 'var(--success)' },
          {
            icon: <TrendingUp size={20} />,
            label: 'Overall Completion',
            value: allDone && totalTaskCount > 0 ? 'ALL DONE' : `${projectProgress}%`,
            sub: allDone && totalTaskCount > 0 ? 'Every task finished' : progressLabel,
            color: allDone ? '#22c55e' : '#f59e0b',
            testId: 'kanban-overall-completion',
          },
          { icon: <Zap size={20} />, label: 'Check Status', value: '100%', sub: 'Safe and secure', color: 'var(--accent)' },
        ].map((stat, i) => (
          <div
            key={i}
            data-testid={'testId' in stat ? stat.testId : undefined}
            className={`control-card control-card-entrance${allDone && i === 2 ? ' control-card--all-done' : ''}`}
            style={{
            padding: '1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animationDelay: `${i * 0.1}s`,
            opacity: 0 // Start hidden for animation
          }}>
            <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', background: stat.color, filter: 'blur(45px)', opacity: 0.12, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: stat.color, marginBottom: '0.5rem' }}>
              {stat.icon}
              <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-sub)' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 950, color: stat.color, lineHeight: 0.9 }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-sub)', marginTop: '0.4rem' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── COMMAND CENTER CONTROLS ─────────────────────────────────────── */}
      <div style={{
        marginTop: '0.5rem',
        padding: '0.6rem',
        background: 'rgba(var(--bg-sub-rgb), 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'board' | 'calendar')}
              className={`control-tab ${activeTab === tab.id ? 'active' : ''}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              aria-label={`Switch to ${tab.label}`}
            >
              <span aria-hidden="true">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', paddingRight: '0.5rem' }}>
          <button className="panel-tool" data-tooltip="Update view" aria-label="Refresh board data" onClick={() => setSyncToken(v => v + 1)}>
            <Activity size={16} aria-hidden="true" />
          </button>
          <button className="panel-tool" data-tooltip="Board Settings" aria-label="Open board settings" onClick={() => router.push('/settings')}>
            <TrendingUp size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── PRIMARY WORKSTATION ────────────────────────────────────────── */}
      <div style={{
        minHeight: '65vh',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'visible',
        position: 'relative',
        transition: 'all 0.4s ease'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, var(--brand), var(--accent), var(--brand))',
          backgroundSize: '200% 100%',
          animation: 'shimmer-sweep 3s infinite linear',
          zIndex: 10
        }} />
        {activeTab === 'board'
          ? (
            <KanbanBoard
              groupId={groupId}
              profile={profile}
              newTaskSignal={newTaskSignal}
              onBoardReady={onWorkspaceReady}
            />
          )
          : <CalendarView groupId={groupId} />
        }
      </div>

      {/* ── SYSTEM STATUS FOOTER ───────────────────────────────────────── */}
      {group && (
        <footer style={{
          marginTop: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Your Team</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {group.name} <span style={{ color: 'var(--text-sub)', fontWeight: 600 }}>&middot; {group.module_code || 'Project'}</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }} className="mobile-hide">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Security</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--success)' }}>Your work is safe with us</span>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', cursor: 'pointer' }}
              onClick={() => router.push('/network')}
            >
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Connection</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div className="pulse-pill" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Online & Ready</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      <style jsx>{`
        .kanban-all-done-banner {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.65rem 1rem;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          border: 1px solid rgba(34, 197, 94, 0.45);
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.14), rgba(var(--brand-rgb), 0.06));
          color: var(--text-main);
          animation: allDonePop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .kanban-all-done-banner__title {
          font-size: 1.35rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          color: #16a34a;
        }
        .kanban-all-done-banner__sub {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-sub);
        }
        :global(.control-card--all-done) {
          border-color: rgba(34, 197, 94, 0.35) !important;
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.12), var(--shadow-sm) !important;
        }
        @keyframes allDonePop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInSlide { 
          from { opacity: 0; transform: translateY(-10px) scale(0.98); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
        @media (max-width: 768px) {
          .mobile-hide { display: none !important; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
