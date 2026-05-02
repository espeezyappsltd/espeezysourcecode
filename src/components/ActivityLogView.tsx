'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import {
  MessageSquare,
  CheckCircle,
  PlusCircle,
  Trash2,
  Settings,
  Palette,
  Shield,
  UserMinus,
  FileUp,
  History,
  Clock,
  Calendar,
  Search,
  X
} from 'lucide-react'
import { LogEntry } from '@/types/ui'

const getActionIcon = (type: string) => {
  switch (type) {
    case 'message_sent': return <MessageSquare size={16} color="var(--brand)" />
    case 'task_created': return <PlusCircle size={16} color="var(--success)" />
    case 'task_updated': return <CheckCircle size={16} color="var(--brand)" />
    case 'task_deleted': return <Trash2 size={16} color="var(--error)" />
    case 'message_deleted': return <Trash2 size={16} color="var(--text-sub)" />
    case 'setting_updated': return <Settings size={16} color="var(--text-main)" />
    case 'theme_changed': return <Palette size={16} color="#e900ff" />
    case 'privacy_toggled': return <Shield size={16} color="var(--warning)" />
    case 'member_kicked': return <UserMinus size={16} color="var(--error)" />
    case 'artifact_uploaded': return <FileUp size={16} color="var(--success)" />
    default: return <History size={16} color="var(--text-sub)" />
  }
}

const groupActivities = (items: LogEntry[]) => {
  const groups: { label: string; items: LogEntry[] }[] = []
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const weekAgo = today - (86400000 * 7)

  items.forEach(item => {
    const time = new Date(item.created_at).getTime()
    let label = 'Older'
    if (time >= today) label = 'Today'
    else if (time >= yesterday) label = 'Yesterday'
    else if (time >= weekAgo) label = 'Past Week'

    const existing = groups.find(g => g.label === label)
    if (existing) existing.items.push(item)
    else groups.push({ label, items: [item] })
  })

  return groups
}

export default function ActivityLogView({ 
  userId, 
  groupId, 
  limit = 50 
}: { 
  userId?: string, 
  groupId?: string, 
  limit?: number 
}) {
  const [activities, setActivities] = useState<LogEntry[]>([])
  const [logSearch, setLogSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const db = useMemo(() => createBrowserSupabaseClient(), [])

  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return activities
    const term = logSearch.toLowerCase()
    return activities.filter(a => 
      a.description.toLowerCase().includes(term) || 
      a.action_type.toLowerCase().includes(term) ||
      a.profiles?.full_name?.toLowerCase().includes(term)
    )
  }, [activities, logSearch])

  const grouped = useMemo(() => groupActivities(filteredLogs), [filteredLogs])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let query = db
      .from('activity_log')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) query = query.eq('user_id', userId)
    if (groupId) query = query.eq('group_id', groupId)

    const { data } = await query
    if (data) setActivities(data as LogEntry[])
    setLoading(false)
  }, [userId, groupId, limit, db])

  useEffect(() => {
    void (async () => {
      await fetchLogs()
    })()

    // Real-time synchronization for the audit log
    const channel = db.channel(`activity_log_${groupId || 'personal'}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activity_log',
          filter: groupId ? `group_id=eq.${groupId}` : userId ? `user_id=eq.${userId}` : undefined
        },
        () => {
          // Re-fetch to get the profile join correctly, or we could optimistic insert
          void fetchLogs()
        }
      )
      .subscribe()

    return () => {
      db.removeChannel(channel)
    }
  }, [fetchLogs, groupId, userId, db])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[1, 2].map(g => (
          <div key={g}>
            <div className="skeleton skeleton-text" style={{ width: '100px', marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                  <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-title" style={{ width: '70%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (activities.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sub)', background: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
      <History size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
      <p>No recent activity recorded.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
       <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
          <input 
            type="text" 
            placeholder="Search activity history..." 
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.8rem' }}
          />
          {logSearch && (
            <button onClick={() => setLogSearch('')} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex' }}><X size={12} /></button>
          )}
       </div>

       {filteredLogs.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-sub)', border: '1px dashed var(--border)', borderRadius: '12px' }}>No logs match &quot;{logSearch}&quot;</div>
       ) : (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           {grouped.map(group => (
        <div key={group.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
             <Calendar size={14} color="var(--brand)" />
             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px' }}>{group.label}</span>
          </div>

          <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--border)', marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {group.items.map(activity => (
              <div key={activity.id} style={{ position: 'relative' }}>
                {/* Connector Dot */}
                <div style={{ position: 'absolute', left: '-2.4rem', top: '0.4rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--brand)', boxShadow: '0 0 8px rgba(var(--brand-rgb), 0.2)' }} />
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                   <div style={{ padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {getActionIcon(activity.action_type)}
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                         <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{activity.description}</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                            <Clock size={12} />
                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         {activity.profiles?.avatar_url && (
                           <img
                             src={activity.profiles.avatar_url}
                             alt={`${activity.profiles.full_name ?? 'System'} avatar`}
                             style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                           />
                         )}
                         <span>{activity.profiles?.full_name || 'System'}</span>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      </div>
    )}
    </div>
  )
}
