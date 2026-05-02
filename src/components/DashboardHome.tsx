'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  onSnapshot, 
  orderBy, 
  limit,
  getCountFromServer,
  QueryConstraint
} from 'firebase/firestore'
import KanbanBoard from './KanbanBoard'
import CalendarView from './CalendarView'
import { LayoutDashboard, Calendar, Activity, Zap, TrendingUp, Users, UserCircle } from 'lucide-react'
import { Group, Profile } from '@/types/database'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from './NotificationProvider'
import { getPlanName, hasFeature } from '@/utils/feature-gate'

interface JoinRequest {
  id: string
  group_id: string
  user_id: string
  status: string
  created_at: string
  profiles?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

const DASHBOARD_TABS = [
  { id: 'board', label: 'Task Board', icon: <LayoutDashboard size={18} /> },
  { id: 'calendar', label: 'Team Calendar', icon: <Calendar size={18} /> },
] as const

export default function DashboardHome({ groupId }: { groupId: string }) {
  const router = useRouter()
  const { profile } = useProfile()
  const { addToast } = useNotifications()
  const [activeTab, setActiveTab] = useState<'board' | 'calendar'>('board')
  const [currentTime, setCurrentTime] = useState(new Date())
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
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const [personalTaskCount, setPersonalTaskCount] = useState(0)
  const [group, setGroup] = useState<Group | null>(null)
  const [newTaskSignal, setNewTaskSignal] = useState(0)
  const [syncToken, setSyncToken] = useState(0)
  const [members, setMembers] = useState<Profile[]>([])
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([])
  const [showMembers, setShowMembers] = useState(false)
  const [projectProgress, setProjectProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('Starting up')
  const [totalBacklog, setTotalBacklog] = useState(0)

  // 0. BLAZING SPEED CACHE: Perceptive hydration
  useEffect(() => {
    if (!groupId) return
    try {
      const cachedGroup = localStorage.getItem(`gf_cache_group_${groupId}`)
      const cachedStats = localStorage.getItem(`gf_cache_stats_${groupId}`)

      if (cachedGroup) {
        const parsedGroup = JSON.parse(cachedGroup) as Group
        queueMicrotask(() => setGroup(parsedGroup))
      }
      if (cachedStats) {
        const stats = JSON.parse(cachedStats)
        queueMicrotask(() => {
          setPersonalTaskCount(stats.personal || 0)
          setTotalBacklog(stats.backlog || 0)
          setProjectProgress(stats.progress || 0)
          setProgressLabel(stats.label || 'Just a moment...')
        })
      }
    } catch (e) {
      console.warn('Cache hydration failed defensively:', e)
    }
  }, [groupId])

  const handleCalendarTaskSaved = useCallback(async () => {
    setSyncToken(prev => prev + 1)
  }, [])

  const fetchGroupDetails = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'groups', groupId))
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Group
        setGroup(data)
        localStorage.setItem(`gf_cache_group_${groupId}`, JSON.stringify(data))
      }
    } catch (err: any) {
      console.error('Fetch group details error:', err.message)
    }
  }, [groupId])

  const fetchMembers = useCallback(async () => {
    if (!groupId) return
    try {
      const q = query(
        collection(db, 'profiles'),
        where('group_id', '==', groupId)
      )
      const snap = await getDocs(q)
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Profile)))
    } catch (err: any) {
      console.error('Error fetching group members:', err.message)
    }
  }, [groupId])

  const fetchPendingRequests = useCallback(async () => {
    if (!groupId || profile?.role !== 'admin') return
    try {
      const q = query(
        collection(db, 'group_join_requests'),
        where('group_id', '==', groupId),
        where('status', '==', 'pending')
      )
      const snap = await getDocs(q)
      const data = await Promise.all(snap.docs.map(async d => {
        const req = d.data()
        const pSnap = await getDoc(doc(db, 'profiles', req.user_id))
        return {
          id: d.id,
          ...req,
          profiles: pSnap.exists() ? { id: pSnap.id, ...pSnap.data() as any } : null
        } as JoinRequest
      }))
      setPendingRequests(data)
    } catch (err: any) {
      console.error('Fetch pending requests error:', err.message)
    }
  }, [groupId, profile?.role])

  const handleAcceptRequest = async (id: string) => {
    const { acceptJoinRequest } = await import('@/app/dashboard/join/actions')
    const res = await acceptJoinRequest(id)
    if (res.error) addToast('Oops, something went wrong', 'We couldn\'t add the member right now. Let\'s try again.', 'error')
    else {
      addToast('All set!', 'Your teammate is now in the group.', 'success')
      void fetchMembers()
      void fetchPendingRequests()
    }
  }

  const handleDeclineRequest = async (id: string) => {
    const { declineJoinRequest } = await import('@/app/dashboard/join/actions')
    const res = await declineJoinRequest(id)
    if (res.error) addToast('Slight issue', 'We couldn\'t update the request. Please try again.', 'error')
    else {
      addToast('Request updated', 'The join request has been removed.', 'info')
      void fetchPendingRequests()
    }
  }

  const fetchPersonalTaskCount = useCallback(async () => {
    if (!profile?.id || !groupId) return
    try {
      const q = query(
        collection(db, 'tasks'),
        where('group_id', '==', groupId),
        where('assignees', 'array-contains', profile.id)
      )
      const snap = await getDocs(q)
      const pendingCount = snap.docs.filter(d => d.data().status !== 'Done').length
      setPersonalTaskCount(pendingCount)
    } catch (err: any) {
      console.warn('Silent failure on personal task count:', err.message)
    }
  }, [profile, groupId])

  const fetchProjectProgress = useCallback(async () => {
    if (!groupId) return
    try {
      const q = query(
        collection(db, 'tasks'),
        where('group_id', '==', groupId)
      )
      const snap = await getDocs(q)
      const tasks = snap.docs.map(d => d.data())

      if (tasks.length === 0) {
        setProjectProgress(0)
        setProgressLabel('Empty Backlog')
        setTotalBacklog(0)
        return
      }

      const pending = tasks.filter((t: any) => t.status !== 'Done').length
      setTotalBacklog(pending)

      const completed = tasks.filter((t: any) => t.status === 'Done').length
      const progress = Math.round((completed / tasks.length) * 100)
      setProjectProgress(progress)

      let label = 'Almost finished'
      if (progress <= 30) label = 'Just starting'
      else if (progress <= 50) label = 'Making progress'
      else if (progress <= 80) label = 'Smoothing things out'
      
      setProgressLabel(label)
      
      localStorage.setItem(`gf_cache_stats_${groupId}`, JSON.stringify({
        personal: personalTaskCount,
        backlog: pending,
        progress: progress,
        label: label
      }))
    } catch (err: any) {
      console.error('Fetch project progress error:', err.message)
    }
  }, [groupId])

  useEffect(() => {
    if (!groupId) return

    const initializeDashboardData = async () => {
      const tasks = [
        fetchGroupDetails(),
        fetchMembers(),
        fetchPendingRequests()
      ]
      
      if (profile?.id) {
        tasks.push(fetchPersonalTaskCount())
        tasks.push(fetchProjectProgress())
      }

      await Promise.all(tasks)
    }

    void initializeDashboardData()

    // Firestore listeners
    const tasksUnsub = onSnapshot(query(collection(db, 'tasks'), where('group_id', '==', groupId)), () => {
      void fetchPersonalTaskCount()
      void fetchProjectProgress()
    })

    const profilesUnsub = onSnapshot(query(collection(db, 'profiles'), where('group_id', '==', groupId)), () => {
      void fetchMembers()
    })

    const requestsUnsub = onSnapshot(query(collection(db, 'group_join_requests'), where('group_id', '==', groupId)), () => {
      void fetchPendingRequests()
    })

    return () => {
      tasksUnsub()
      profilesUnsub()
      requestsUnsub()
    }
  }, [profile?.id, groupId, fetchPersonalTaskCount, fetchProjectProgress, fetchMembers, fetchPendingRequests])

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
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)', width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>

      {/* ── CONTROL PANEL HEADER ─────────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>

          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 950, letterSpacing: '-0.04em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {greeting}, {profile?.full_name?.split(' ')[0] || 'User'}
            {profile?.subscription_plan === 'premium' && <span className="locked-badge locked-badge-premium glow-premium" style={{ margin: 0, fontSize: '0.7rem' }}>{getPlanName('premium').toUpperCase()}</span>}
            {profile?.subscription_plan === 'pro' && <span className="locked-badge locked-badge-pro glow-pro" style={{ margin: 0, fontSize: '0.7rem' }}>{getPlanName('pro').toUpperCase()}</span>}
            {profile?.subscription_plan === 'lifetime' && <span className="locked-badge locked-badge-premium glow-premium" style={{ margin: 0, fontSize: '0.7rem' }}>{getPlanName('lifetime').toUpperCase()}</span>}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
            <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(var(--brand-rgb), 0.08)', borderRadius: '10px', border: '1px solid rgba(var(--brand-rgb), 0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <Zap size={12} color="var(--brand)" fill="var(--brand)" style={{ opacity: 0.8 }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                TEAM: <span style={{ color: 'var(--brand)' }}>{group?.name || 'STARTING UP...'}</span>
              </span>
            </div>

            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`btn ${showMembers ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.8rem',
                fontWeight: 900,
                padding: '0.65rem 1.4rem',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                border: showMembers ? 'none' : '1px solid var(--border)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: showMembers ? '0 4px 12px rgba(var(--brand-rgb), 0.3)' : 'var(--shadow-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <Users size={16} />
              Team Roster
              <span style={{
                background: showMembers ? 'white' : 'var(--brand)',
                color: showMembers ? 'var(--brand)' : 'white',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.7rem',
                marginLeft: '0.4rem',
                fontWeight: 950
              }}>
                {members.length || 0} / {group?.capacity || 5}
                {pendingRequests.length > 0 && ` (+${pendingRequests.length} PENDING)`}
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
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Active Members</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {members.map(m => {
                  const isSelf = m.id === profile?.id
                  const lastSeenDate = m.last_seen ? new Date(m.last_seen) : null
                  const isOnline = lastSeenDate && (new Date().getTime() - lastSeenDate.getTime() < 120000)

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
                      onClick={() => router.push(`/dashboard/network/profile/${m.id}`)}
                    >
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: 'var(--brand)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                          {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.full_name?.[0]}
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
              {pendingRequests.length > 0 && (
                <>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Incoming Requests ({pendingRequests.length})</div>
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
                            {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={18} color="var(--text-sub)" />}
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

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setNewTaskSignal(prev => prev + 1)}
            className="btn btn-primary btn-inline"
            aria-label="Create a new task"
            style={{ padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: 900 }}
          >
            <Zap size={16} fill="currentColor" aria-hidden="true" /> New Task
          </button>
          <button
            onClick={() => router.push(`/dashboard/analytics/${groupId}`)}
            className="btn btn-secondary btn-inline"
            aria-label="View group updates and progress"
            style={{ padding: '0.8rem 1.5rem', borderRadius: '16px', fontWeight: 800 }}
          >
            Group Updates
          </button>
        </div>
      </header>

      {/* ── METRICS MODULES ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {[
          { icon: <Activity size={20} />, label: 'Your Goals', value: personalTaskCount, sub: 'Tasks for you to do', color: 'var(--brand)' },
          { icon: <Users size={20} />, label: 'Team Progress', value: totalBacklog, sub: 'Tasks left for the team', color: 'var(--success)' },
          { icon: <TrendingUp size={20} />, label: 'Overall Completion', value: `${projectProgress}%`, sub: progressLabel, color: '#f59e0b' },
          { icon: <Zap size={20} />, label: 'Check Status', value: '100%', sub: 'Safe and secure', color: 'var(--accent)' }
        ].map((stat, i) => (
          <div key={i} className="control-card control-card-entrance" style={{
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
            <div style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--text-main)', lineHeight: 0.9 }}>{stat.value}</div>
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
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', paddingRight: '0.5rem' }}>
          <button className="panel-tool" data-tooltip="Update view" aria-label="Refresh board data" onClick={() => setSyncToken(v => v + 1)}>
            <Activity size={16} aria-hidden="true" />
          </button>
          <button className="panel-tool" data-tooltip="Board Settings" aria-label="Open board settings" onClick={() => router.push('/dashboard/settings')}>
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
        overflow: 'hidden',
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
          ? <KanbanBoard groupId={groupId} key={`board-${syncToken}`} profile={profile} newTaskSignal={newTaskSignal} />
          : <CalendarView groupId={groupId} key={`cal-${syncToken}`} onTaskSaved={handleCalendarTaskSaved} />
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
              onClick={() => router.push('/dashboard/network')}
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
