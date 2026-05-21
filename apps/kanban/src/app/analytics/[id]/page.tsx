'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { 
  BarChart3, Users, FileCheck, AlertCircle, Download, Printer,
  ChevronRight, TrendingUp, ShieldCheck, Zap, Clock, UserCircle, CheckCircle2, Circle, Timer, Search
} from 'lucide-react'
import { usePresence } from '@/components/PresenceProvider'
import ActivityLogView from '@/components/ActivityLogView'
import { AnalyticsPrintReport } from '@/components/analytics/AnalyticsPrintReport'
import { useNotifications } from '@/components/NotificationProvider'
import { Group, Task, Profile as ProfileDB, Artifact, ActivityLogRow } from '@/types/database'
import { Profile } from '@/types/auth'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  fetchActivityLogByGroup,
  fetchArtifactsByGroup,
  fetchGroupById,
  fetchGroupMembers,
  fetchGroupTasks,
  fetchProfileById,
  fetchTeamMarketplaceTransactions,
  getAuthUser,
  type MarketplaceTxRow,
} from '@/services/dashboard'
import { buildIntelligenceReportCsv } from '@/lib/analytics/intelligence-report'
import { downloadTextFile } from '@/lib/activity/activity-export'
import '../analytics-print.css'
import { useProfile } from '@/context/ProfileContext'
import { hasFeature } from '@/utils/feature-gate'
import PremiumFeatureGate from '@/components/PremiumFeatureGate'
import { friendlySupabaseError } from '@/utils/supabase-errors'
const CATEGORY_COLORS: Record<string, string> = {
  'Implementation': '#38bdf8',
  'Architecture':   '#8b5cf6',
  'UX/UI Design':   '#ec4899',
  'Quality Assurance': '#10b981',
  'Research':       '#f59e0b',
  'Mentorship':     '#6366f1',
  'Documentation':  '#64748b',
  'DevOps':         '#06b6d4',
  'Ethics & Legal': '#ef4444',
}

const STATUS_COLORS: Record<string, string> = {
  'To Do':       '#64748b',
  'In Progress': '#f59e0b',
  'Done':        '#10b981',
}

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const [pageLoading, setPageLoading] = useState(true)
  const [joinSubmitting, setJoinSubmitting] = useState(false)
  const [joinPreview, setJoinPreview] = useState<{
    memberCount: number
    capacity: number
    hasPendingRequest: boolean
  } | null>(null)
  const [hasSentRequest, setHasSentRequest] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { addToast } = useNotifications()
  const { profile: contextProfile, loading: profileLoading } = useProfile()
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [group, setGroup] = useState<Group | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskSearch, setTaskSearch] = useState('')
  const [members, setMembers] = useState<ProfileDB[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLogRow[]>([])
  const [marketplaceTx, setMarketplaceTx] = useState<MarketplaceTxRow[]>([])
  const [mounted, setMounted] = useState(false)
  const { onlineUsers } = usePresence()
  const canViewStats = hasFeature(contextProfile, 'PROJECT_STATS')

  const fetchData = useCallback(async () => {
    setPageLoading(true)
    setFetchError(null)

    const authUser = await getAuthUser()
    if (!authUser) {
      setPageLoading(false)
      return
    }

    try {
      const [profileRes, groupRes, tasksRes, membersRes, artifactsRes] = await Promise.allSettled([
        fetchProfileById(authUser.id),
        fetchGroupById(groupId),
        fetchGroupTasks(groupId),
        fetchGroupMembers(groupId),
        fetchArtifactsByGroup(groupId),
      ])

      const rejectReason = [profileRes, groupRes, tasksRes, membersRes, artifactsRes].find(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      )
      if (groupRes.status === 'rejected') {
        throw groupRes.reason
      }

      const userProfile = profileRes.status === 'fulfilled' ? profileRes.value : null
      const groupData = groupRes.status === 'fulfilled' ? groupRes.value : null
      const groupTasks = tasksRes.status === 'fulfilled' ? tasksRes.value : []
      const groupMembers =
        membersRes.status === 'fulfilled' ? (membersRes.value as ProfileDB[]) : []
      const groupArtifacts = artifactsRes.status === 'fulfilled' ? artifactsRes.value : []

      if (!groupData) {
        setFetchError('This team could not be found.')
        setGroup(null)
        return
      }

      if (rejectReason && profileRes.status === 'rejected') {
        console.warn('Analytics profile fetch failed:', rejectReason.reason)
      }
      if (tasksRes.status === 'rejected') {
        console.warn('Analytics tasks fetch failed:', tasksRes.reason)
      }
      if (membersRes.status === 'rejected') {
        console.warn('Analytics members fetch failed:', membersRes.reason)
      }

      setCurrentUser(userProfile as unknown as Profile)
      const membersList = groupMembers
      const memberCheck =
        membersList.some((m) => m.id === authUser.id) || userProfile?.group_id === groupId
      setIsMember(memberCheck)
      setGroup(groupData as Group)

      if (memberCheck) {
        setJoinPreview(null)
        const [logs, mktTx] = await Promise.all([
          fetchActivityLogByGroup(groupId),
          fetchTeamMarketplaceTransactions(membersList).catch((err) => {
            console.warn('Marketplace tx fetch failed:', err)
            return []
          }),
        ])
        setTasks(groupTasks as Task[])
        setMembers(membersList)
        setArtifacts(groupArtifacts)
        setActivityLogs(logs)
        setMarketplaceTx(mktTx)
      } else {
        const { fetchTeamJoinPreview } = await import('@/app/join/actions')
        const preview = await fetchTeamJoinPreview(groupId)
        setJoinPreview(preview)
        setHasSentRequest(preview.hasPendingRequest)
        setMembers([])
        setTasks([])
        setArtifacts([])
        setActivityLogs([])
        setMarketplaceTx([])
      }
    } catch (err: unknown) {
      console.error('Analytics Fetch Error:', err)
      const message =
        err && typeof err === 'object' && 'message' in err
          ? friendlySupabaseError(String((err as { message: unknown }).message), 'Failed to retrieve project intelligence.')
          : 'Failed to retrieve project intelligence.'
      setFetchError(message)
      addToast('Sync Error', message, 'error')
    } finally {
      setPageLoading(false)
    }
  }, [groupId, addToast])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (profileLoading) return
    if (!canViewStats) {
      setPageLoading(false)
      return
    }
    void fetchData()
  }, [profileLoading, canViewStats, fetchData])

  const handleJoinRequest = async () => {
    if (!currentUser || !group || hasSentRequest || joinSubmitting) return

    setJoinSubmitting(true)
    try {
      const { sendJoinRequest } = await import('@/app/join/actions')
      const res = await sendJoinRequest(groupId, currentUser.full_name || 'A student')
      if (!res.success) {
        addToast('Join request failed', res.error, 'error')
        return
      }
      setHasSentRequest(true)
      setJoinPreview((prev) => (prev ? { ...prev, hasPendingRequest: true } : prev))
      if (res.alreadyPending) {
        addToast('Already requested', 'You already have a pending request for this team.', 'info')
        return
      }
      addToast(
        'Request sent',
        res.chatPosted
          ? 'Your team lead was notified and your intro was posted in team chat.'
          : 'Your team lead was notified. You can add a message in Settings → Workspace.',
        'success',
      )
    } catch (err: unknown) {
      const { friendlyJoinRequestError } = await import('@/lib/team/join-request-errors')
      addToast('Join request failed', friendlyJoinRequestError(err), 'error')
    } finally {
      setJoinSubmitting(false)
    }
  }

  // --- METRICS ---
  const doneTasks = tasks.filter(t => t.status === 'Done').length
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length
  const todoTasks = tasks.filter(t => t.status === 'To Do').length
  const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done').length
  const riskLevel = overdueTasks > 3 ? 'Critical' : overdueTasks > 0 ? 'Elevated' : 'Optimal'
  const totalEvidence = artifacts.length
  const evidenceDensity = tasks.length > 0 ? (totalEvidence / tasks.length).toFixed(1) : '0'

  const calculateMemberEffort = (memberId: string) =>
    tasks.filter(t => t.status === 'Done' && t.assignees?.includes(memberId)).length

  const assignmentCompletions = members.reduce(
    (acc, m) => acc + calculateMemberEffort(m.id),
    0,
  )

  // --- CHART DATA ---
  const statusPieData = [
    { name: 'Done', value: doneTasks, color: STATUS_COLORS['Done'] },
    { name: 'In Progress', value: inProgressTasks, color: STATUS_COLORS['In Progress'] },
    { name: 'To Do', value: todoTasks, color: STATUS_COLORS['To Do'] },
  ].filter(d => d.value > 0)

  const categoryBarData = Object.keys(CATEGORY_COLORS)
    .map(cat => ({ name: cat.replace(' ', '\n'), fullName: cat, count: tasks.filter(t => t.category === cat).length, color: CATEGORY_COLORS[cat] }))
    .filter(d => d.count > 0)

  const memberBarData = members.map((m) => ({
    name: (m.full_name || 'Unknown').split(' ')[0],
    completed: calculateMemberEffort(m.id),
    assigned: tasks.filter((t) => t.assignees?.includes(m.id)).length,
  }))

  const leaderboardMembers = [...members].sort(
    (a, b) => calculateMemberEffort(b.id) - calculateMemberEffort(a.id),
  )

  const reportKpis = {
    completionRate,
    doneTasks,
    totalTasks: tasks.length,
    inProgressTasks,
    todoTasks,
    overdueTasks,
    riskLevel,
    evidenceDensity,
    memberCount: members.length,
    teamCapacity: group?.capacity || 5,
    uniqueTasksCompleted: doneTasks,
    assignmentCompletions,
  }

  const handlePrint = () => {
    document.body.classList.add('print-analytics')
    window.print()
    window.addEventListener(
      'afterprint',
      () => document.body.classList.remove('print-analytics'),
      { once: true },
    )
  }

  const exportToCSV = async () => {
    setExporting(true)
    try {
      const logs =
        activityLogs.length > 0 ? activityLogs : await fetchActivityLogByGroup(groupId)
      const mkt =
        marketplaceTx.length > 0
          ? marketplaceTx
          : await fetchTeamMarketplaceTransactions(members)

      const csv = buildIntelligenceReportCsv({
        group,
        kpis: reportKpis,
        statusPie: statusPieData,
        categoryBar: categoryBarData,
        memberBar: memberBarData,
        tasks,
        members,
        activityLogs: logs,
        marketplaceTx: mkt,
      })

      const stamp = new Date().toISOString().split('T')[0]
      downloadTextFile(
        csv,
        `Espeezy_Intelligence_${group?.module_code || 'Report'}_${stamp}.csv`,
      )
      addToast('Report ready', 'Full intelligence CSV with chart data downloaded.', 'success')
    } catch (err) {
      console.error('Export error:', err)
      addToast('Export failed', 'Could not build the intelligence report. Try again.', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (!profileLoading && !canViewStats) {
    return <PremiumFeatureGate feature="PROJECT_STATS" />
  }

  if (fetchError && !pageLoading && !group) {
    return (
      <div style={{ maxWidth: '560px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--error)', fontWeight: 700, marginBottom: '1rem' }}>{fetchError}</p>
        <button type="button" className="btn btn-primary" onClick={() => void fetchData()}>
          Try again
        </button>
      </div>
    )
  }

  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-sub)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
          {isMember ? 'Retrieving project intelligence…' : 'Loading team overview…'}
        </p>
      </div>
    </div>
  )

  if (!isMember) {
    return (
      <div style={{ maxWidth: '1000px', margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ padding: '4rem', background: 'var(--bg-sub)', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
           <div style={{ width: '80px', height: '80px', background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <ShieldCheck size={40} />
           </div>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>{group?.name || 'Private Team'}</h1>
           <p style={{ color: 'var(--text-sub)', fontSize: '1.2rem', marginBottom: '2.5rem' }}>
             This team is private. You must be a member to see their work and news.
           </p>

           <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '3rem' }}>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{joinPreview?.memberCount ?? members.length}{joinPreview ? ` / ${joinPreview.capacity}` : ''}</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>Team Members</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{group?.module_code || '---'}</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>Module Code</div>
              </div>
           </div>

           <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={handleJoinRequest} 
                disabled={hasSentRequest || joinSubmitting}
                className={hasSentRequest ? 'btn btn-secondary' : 'btn btn-primary'}
                style={{ padding: '1rem 2.5rem', width: 'auto', fontSize: '1.1rem', opacity: hasSentRequest ? 0.7 : 1, cursor: hasSentRequest ? 'default' : 'pointer' }}
              >
                {joinSubmitting
                  ? 'Sending request…'
                  : hasSentRequest
                    ? 'Request sent. Waiting for team leader approval'
                    : 'Request to Join'}
              </button>
              <Link href="/network" className="btn btn-secondary" style={{ padding: '1rem 2.5rem', width: 'auto', fontSize: '1.1rem' }}>
                Back to Network
              </Link>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade page-shell page-shell--wide analytics-print-root">

      {/* Header */}
      <header className="page-header analytics-screen-only print-hide">
        <div className="page-header__main">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand)', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <BarChart3 size={14} /><span>Analytics Summary</span>
          </div>
          <h1 className="page-header__title">{group?.name || 'Project'}</h1>
          <p className="page-header__desc">{group?.module_code} • Live project tracking</p>
        </div>
        <div className="page-header__actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={() => void exportToCSV()} disabled={exporting} className="btn btn-ghost btn-inline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <Download size={14} /> {exporting ? 'Exporting…' : 'CSV'}
          </button>
          <button type="button" onClick={handlePrint} className="btn btn-primary btn-inline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <Printer size={14} /> Print
          </button>
        </div>
      </header>

      <AnalyticsPrintReport
        group={group}
        completionRate={completionRate}
        doneTasks={doneTasks}
        tasks={tasks}
        inProgressTasks={inProgressTasks}
        todoTasks={todoTasks}
        overdueTasks={overdueTasks}
        riskLevel={riskLevel}
        evidenceDensity={evidenceDensity}
        members={members}
        totalGroupEffort={assignmentCompletions}
        statusPieData={statusPieData}
        categoryBarData={categoryBarData}
        memberBarData={memberBarData}
        marketplaceTx={marketplaceTx}
        activityLogs={activityLogs}
      />

      {/* KPI Row */}
      <div className="kpi-grid analytics-screen-only" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: 'var(--gap-sm)', 
        marginBottom: '1.5rem' 
      }}>
        {[
          { testId: 'analytics-kpi-progress', icon: <Zap size={18} />, label: 'Project Progress', value: `${completionRate}%`, color: 'var(--brand)', bg: 'rgba(56,189,248,0.1)' },
          { testId: 'analytics-kpi-completed', icon: <CheckCircle2 size={18} />, label: 'Completed Tasks', value: `${doneTasks}/${tasks.length}`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { testId: 'analytics-kpi-members', icon: <Users size={18} />, label: 'Team Members', value: `${members.length} / ${group?.capacity || 5}`, color: 'var(--brand)', bg: 'rgba(56,189,248,0.1)' },
          { testId: 'analytics-kpi-risk', icon: <AlertCircle size={18} />, label: 'Risk Assessment', value: riskLevel, color: riskLevel === 'Optimal' ? '#10b981' : '#ef4444', bg: riskLevel === 'Optimal' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' },
          { testId: 'analytics-kpi-evidence', icon: <ShieldCheck size={18} />, label: 'Evidence Density', value: evidenceDensity, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { testId: 'analytics-kpi-overdue', icon: <Timer size={18} />, label: 'Overdue Tasks', value: overdueTasks, color: overdueTasks > 0 ? '#ef4444' : '#10b981', bg: overdueTasks > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' },
        ].map(kpi => (
          <div key={kpi.label} data-testid={kpi.testId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'var(--kpi-p)', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="kpi-card-print">
            <div style={{ padding: '0.5rem', background: kpi.bg, color: kpi.color, borderRadius: '10px', flexShrink: 0 }} className="print-hide">{kpi.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-sub)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid analytics-screen-only" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 'var(--gap-sm)', 
        marginBottom: '1.5rem' 
      }}>

        {/* Task Status Donut */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 800 }}>Task Status</h3>
          {!mounted || tasks.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontSize: '0.85rem' }}>{!mounted ? 'Calibrating...' : 'No tasks yet'}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                    {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} tasks`, n]} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {statusPieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ color: 'var(--text-sub)' }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Task Categories Bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 800 }}>By Category</h3>
          {!mounted || categoryBarData.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontSize: '0.85rem' }}>{!mounted ? 'Calibrating...' : 'No tasks'}</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryBarData} layout="vertical" margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="fullName" tick={{ fontSize: 9, fill: 'var(--text-sub)' }} width={80} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '0.75rem' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                  {categoryBarData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Member Contribution */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 800 }}>Contribution</h3>
          {!mounted || members.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontSize: '0.85rem' }}>{!mounted ? 'Calibrating...' : 'No members'}</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={memberBarData} margin={{ left: -25, right: 10, top: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-sub)' }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-sub)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '0.75rem' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '0.65rem', paddingTop: '0.5rem' }} />
                <Bar dataKey="assigned" name="Assigned" fill="rgba(56,189,248,0.2)" radius={[2,2,0,0]} />
                <Bar dataKey="completed" name="Done" fill="#10b981" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Progress Bar  -  overall */}
      <div className="analytics-screen-only" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Project Pulse</span>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--brand)' }}>{completionRate}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand), #10b981)', borderRadius: '8px', transition: 'width 1s ease' }} />
        </div>
      </div>

      {/* Main Two-Column */}
      <div className="analytics-details-grid analytics-screen-only" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 'var(--gap-sm)' 
      }}>

        {/* Team Leaderboard  -  fixed table */}
        <section style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Team Leaderboard</h2>
          </div>

          {members.length === 0 ? (
            <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '1rem 0' }}>Syncing with the institutional graph...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {leaderboardMembers.map((member, idx) => {
                const isOnline = onlineUsers.has(member.id)
                const tasksDone = calculateMemberEffort(member.id)
                const assigned = tasks.filter(t => t.assignees?.includes(member.id)).length
                
                return (
                  <div key={member.id} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem', borderRadius: '16px',
                    background: idx === 0 ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)',
                    border: `1px solid ${idx === 0 ? 'var(--brand)' : 'var(--border)'}`,
                    transition: 'transform 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Rank Badge */}
                    <div style={{ width: '28px', textAlign: 'center', fontWeight: 950, fontSize: '1rem', color: idx === 0 ? '#fbbf24' : 'var(--text-sub)', flexShrink: 0 }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>

                    {/* Avatar with Status */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface)', border: '2px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {member.avatar_url ? <img src={member.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={24} color="var(--text-sub)" />}
                      </div>
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: isOnline ? '#10b981' : 'var(--border)', border: '2px solid var(--surface)', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} title={isOnline ? "Online" : "Offline"} />
                    </div>

                    {/* Member Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.full_name || 'Anonymous Specialist'}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>{member.role || 'Collaborator'}</span>
                        <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'var(--border)' }} />
                        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800 }}>{tasksDone} done</span>
                        {assigned > 0 && (
                          <>
                            <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'var(--border)' }} />
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 700 }}>{assigned} assigned</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 950, fontSize: '1.1rem', color: idx === 0 ? 'var(--brand)' : 'var(--text-main)', lineHeight: 1 }}>
                        {tasksDone}/{assigned || '—'}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-sub)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Done</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '1rem' }}>Activity Stream</h3>
            <ActivityLogView groupId={groupId} scope="group" limit={25} showExport />
          </div>
        </section>

        {/* Right sidebar */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Pipeline Metrics */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={16} color="var(--brand)" /> Focus Areas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
                const count = tasks.filter(t => t.category === cat).length
                if (count === 0) return null
                const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 700 }}>
                      <span>{cat}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-main)', borderRadius: '10px' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '10px' }} />
                    </div>
                  </div>
                )
              })}
              {tasks.length === 0 && <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>No data yet</p>}
            </div>
          </div>

          {/* Recently Completed */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', padding: '1.25rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
             <h3 style={{ fontSize: '0.95rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
               <Clock size={16} color="var(--brand)" /> Success Log
             </h3>
             <div style={{ position: 'relative', width: '180px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
                <input 
                  type="text" 
                  placeholder="Filter tasks..." 
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.5rem 0.4rem 2rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.75rem' }}
                />
             </div>
           </div>
            {tasks.filter(t => t.status === 'Done').length === 0 ? (
              <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>Check back later</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {tasks
                  .filter(t => t.status === 'Done')
                  .filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()))
                  .slice(0, 10)
                  .map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '10px' }}>
                    <FileCheck size={14} color="#10b981" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.title}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>
                        {t.category && <span style={{ color: CATEGORY_COLORS[t.category] || 'var(--brand)', fontWeight: 800 }}>{t.category}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/" style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem' }}>
                  Full Board <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </div>

        </section>
      </div>

      <style jsx>{`
        .kpi-grid, .charts-grid, .analytics-details-grid {
           --gap-sm: 1.5rem;
           --kpi-p: 1.25rem 1.5rem;
        }
        @media (max-width: 768px) {
          .kpi-grid { 
            grid-template-columns: repeat(2, 1fr) !important; 
            --gap-sm: 0.75rem;
            --kpi-p: 1rem;
          }
          .charts-grid, .analytics-details-grid {
            --gap-sm: 1rem;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
