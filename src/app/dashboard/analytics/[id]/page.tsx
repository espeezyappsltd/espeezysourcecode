'use client'

import { useState, useEffect, use } from 'react'
import { db, auth } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore'
import { 
  BarChart3, Users, FileCheck, AlertCircle, Download, Printer,
  ChevronRight, TrendingUp, ShieldCheck, Zap, Clock, UserCircle, CheckCircle2, Circle, Timer, Search
} from 'lucide-react'
import { usePresence } from '@/components/PresenceProvider'
import ActivityLogView from '@/components/ActivityLogView'
import { useNotifications } from '@/components/NotificationProvider'
import { Group, Task, Profile as ProfileDB } from '@/types/database'
import { Profile } from '@/types/auth'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar
} from 'recharts'

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
  const [loading, setLoading] = useState(true)
  const { addToast } = useNotifications()
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [group, setGroup] = useState<Group | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskSearch, setTaskSearch] = useState('')
  const [members, setMembers] = useState<ProfileDB[]>([])
  const [artifacts, setArtifacts] = useState<Record<string, any>[]>([])
  const [mounted, setMounted] = useState(false)
  const { onlineUsers } = usePresence()

  useEffect(() => { 
    setMounted(true)
    fetchData() 
  }, [groupId])

  const fetchData = async () => {
    setLoading(true)
    
    const authUser = auth.currentUser
    if (!authUser) {
      setLoading(false)
      return
    }

    try {
      const [profileSnap, groupSnap, tasksSnap, membersSnap, artifactsSnap] = await Promise.all([
        getDoc(doc(db, 'profiles', authUser.uid)),
        getDoc(doc(db, 'groups', groupId)),
        getDocs(query(collection(db, 'tasks'), where('group_id', '==', groupId))),
        getDocs(query(collection(db, 'profiles'), where('group_id', '==', groupId), orderBy('total_score', 'desc'))),
        getDocs(query(collection(db, 'artifacts'), where('group_id', '==', groupId)))
      ])

      if (profileSnap.exists()) {
        const userProfile = profileSnap.data() as Profile
        setCurrentUser(userProfile)
        const memberCheck = userProfile?.group_id === groupId
        setIsMember(memberCheck)
      }

      if (groupSnap.exists()) {
        setGroup({ id: groupSnap.id, ...groupSnap.data() } as Group)
      }
      
      const memberCheck = (profileSnap.data() as Profile)?.group_id === groupId
      
      if (memberCheck) {
        setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)))
        setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProfileDB)))
        setArtifacts(artifactsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } else {
        setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProfileDB)))
      }
    } catch (err: unknown) {
      console.error('Analytics Fetch Error:', err)
      addToast('Sync Error', 'Failed to retrieve project intelligence.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const [hasSentRequest, setHasSentRequest] = useState(false)

  const handleJoinRequest = async () => {
    if (!currentUser || !group || hasSentRequest) return
    
    setLoading(true)
    try {
      const { sendJoinRequest } = await import('@/app/dashboard/join/actions')
      await sendJoinRequest(groupId, currentUser.full_name || 'A student')
      setHasSentRequest(true)
      addToast('Sync Success', 'Protocol access request has been transmitted to team leader.', 'success')
    } catch (err: unknown) {
      addToast('System Error', 'Failed to transmit access request: ' + (err instanceof Error ? err.message : String(err)), 'error')
    } finally {
      setLoading(false)
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

  const totalGroupEffort = members.reduce((acc, m) => acc + calculateMemberEffort(m.id), 0)

  // --- CHART DATA ---
  const statusPieData = [
    { name: 'Done', value: doneTasks, color: STATUS_COLORS['Done'] },
    { name: 'In Progress', value: inProgressTasks, color: STATUS_COLORS['In Progress'] },
    { name: 'To Do', value: todoTasks, color: STATUS_COLORS['To Do'] },
  ].filter(d => d.value > 0)

  const categoryBarData = Object.keys(CATEGORY_COLORS)
    .map(cat => ({ name: cat.replace(' ', '\n'), fullName: cat, count: tasks.filter(t => t.category === cat).length, color: CATEGORY_COLORS[cat] }))
    .filter(d => d.count > 0)

  const memberBarData = members.map(m => ({
    name: (m.full_name || 'Unknown').split(' ')[0],
    completed: calculateMemberEffort(m.id),
    assigned: tasks.filter(t => t.assignees?.includes(m.id)).length,
  }))

  // --- EXPORT ---
  const exportToCSV = async () => {
    setLoading(true)
    try {
      const logsSnap = await getDocs(query(
        collection(db, 'activity_log'), 
        where('group_id', '==', groupId), 
        orderBy('created_at', 'desc')
      ))
      const headers = ['Type', 'User', 'Description', 'Timestamp']
      const rows = logsSnap.docs.map(doc => {
        const l = doc.data()
        return [l.action_type, l.user_name || 'System', l.description, l.created_at]
      })
      const csvContent = [headers, ...rows].map(e => e.map(c => `"${c}"`).join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `Espeezy_${group?.module_code || 'Report'}_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
    } catch (err) {
      console.error('Export error:', err)
      addToast('System Error', 'Failed to generate intelligence report.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-sub)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Retrieving project intelligence...</p>
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
                 <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{members.length}</div>
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
                disabled={hasSentRequest || loading}
                className={hasSentRequest ? "btn btn-secondary" : "btn btn-primary"} 
                style={{ padding: '1rem 2.5rem', width: 'auto', fontSize: '1.1rem', opacity: hasSentRequest ? 0.7 : 1, cursor: hasSentRequest ? 'default' : 'pointer' }}
              >
                {hasSentRequest ? 'Request sent. Waiting for team leader approval' : 'Request to Join'}
              </button>
              <Link href="/dashboard/network" className="btn btn-secondary" style={{ padding: '1rem 2.5rem', width: 'auto', fontSize: '1.1rem' }}>
                Back to Network
              </Link>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 var(--p-safe)', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand)', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <BarChart3 size={14} /><span>Analytics Summary</span>
          </div>
          <h1 className="fluid-h1" style={{ fontWeight: 900, margin: 0 }}>{group?.name || 'Project'}</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            {group?.module_code} • Live project tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportToCSV} className="btn btn-ghost btn-inline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-primary btn-inline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <Printer size={14} /> Print
          </button>
        </div>
      </header>

      {/* KPI Row */}
      <div className="kpi-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: 'var(--gap-sm)', 
        marginBottom: '1.5rem' 
      }}>
        {[
          { icon: <Zap size={18} />, label: 'Project Progress', value: `${completionRate}%`, color: 'var(--brand)', bg: 'rgba(56,189,248,0.1)' },
          { icon: <CheckCircle2 size={18} />, label: 'Completed Tasks', value: `${doneTasks}/${tasks.length}`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { icon: <Users size={18} />, label: 'Team Members', value: `${members.length} / ${group?.capacity || 5}`, color: 'var(--brand)', bg: 'rgba(56,189,248,0.1)' },
          { icon: <AlertCircle size={18} />, label: 'Risk Assessment', value: riskLevel, color: riskLevel === 'Optimal' ? '#10b981' : '#ef4444', bg: riskLevel === 'Optimal' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' },
          { icon: <ShieldCheck size={18} />, label: 'Evidence Density', value: evidenceDensity, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { icon: <Timer size={18} />, label: 'Overdue Tasks', value: overdueTasks, color: overdueTasks > 0 ? '#ef4444' : '#10b981', bg: overdueTasks > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'var(--kpi-p)', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="kpi-card-print">
            <div style={{ padding: '0.5rem', background: kpi.bg, color: kpi.color, borderRadius: '10px', flexShrink: 0 }} className="print-hide">{kpi.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-sub)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid" style={{ 
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

      {/* Progress Bar — overall */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Project Pulse</span>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--brand)' }}>{completionRate}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand), #10b981)', borderRadius: '8px', transition: 'width 1s ease' }} />
        </div>
      </div>

      {/* Main Two-Column */}
      <div className="analytics-details-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 'var(--gap-sm)' 
      }}>

        {/* Team Leaderboard — fixed table */}
        <section style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Team Leaderboard</h2>
          </div>

          {members.length === 0 ? (
            <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '1rem 0' }}>Syncing with the institutional graph...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {members.map((member, idx) => {
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
                        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800 }}>{tasksDone} Tasks Done</span>
                      </div>
                    </div>

                    {/* Points Tally */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 950, fontSize: '1.25rem', color: idx === 0 ? 'var(--brand)' : 'var(--text-main)', lineHeight: 1 }}>{member.total_score ?? 0}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-sub)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '1rem' }}>Activity Stream</h3>
            <ActivityLogView groupId={groupId} limit={10} />
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
                <Link href="/dashboard" style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem' }}>
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
        @media print {
          @page { margin: 1cm; }
          button, .print-hide, .btn, .panel-tool, header .btn-inline { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; }
          .page-fade { animation: none !important; transform: none !important; }
          .kpi-grid { gap: 0.5rem !important; }
          .kpi-card-print { border: 1px solid #eee !important; box-shadow: none !important; }
          .charts-grid { display: block !important; }
          .charts-grid > div { margin-bottom: 2rem !important; page-break-inside: avoid !important; border: 1px solid #eee !important; }
          aside, nav, .sidebar-container, .mobile-header { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
