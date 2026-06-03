'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import { fetchActivityFeed } from '@/services/dashboard'
import { buildActivityLogCsv, downloadTextFile } from '@/lib/activity/activity-export'
import type { ActivityLogRow } from '@/types/database'
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
  X,
  Download,
  ShoppingBag,
  CreditCard,
  Coins,
  UserPlus,
  LogIn,
} from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'

type LogItem = ActivityLogRow & {
  profiles?: { full_name: string | null; avatar_url: string | null } | null
}

const getActionIcon = (type: string) => {
  switch (type) {
    case 'message_sent':
      return <MessageSquare size={16} color="var(--brand)" />
    case 'task_created':
      return <PlusCircle size={16} color="var(--success)" />
    case 'task_updated':
      return <CheckCircle size={16} color="var(--brand)" />
    case 'task_deleted':
      return <Trash2 size={16} color="var(--error)" />
    case 'message_deleted':
      return <Trash2 size={16} color="var(--text-sub)" />
    case 'setting_updated':
      return <Settings size={16} color="var(--text-main)" />
    case 'theme_changed':
      return <Palette size={16} color="#e900ff" />
    case 'privacy_toggled':
      return <Shield size={16} color="var(--warning)" />
    case 'member_kicked':
      return <UserMinus size={16} color="var(--error)" />
    case 'artifact_uploaded':
      return <FileUp size={16} color="var(--success)" />
    case 'marketplace_purchase':
    case 'marketplace_sale':
      return <ShoppingBag size={16} color="var(--brand)" />
    case 'credits_purchase':
    case 'credits_transfer':
    case 'wallet_topup':
      return <CreditCard size={16} color="#10b981" />
    case 'credits_spent':
    case 'credits_earned':
      return <Coins size={16} color="#f59e0b" />
    case 'join_request':
    case 'join_request_approved':
    case 'member_joined':
      return <UserPlus size={16} color="var(--brand)" />
    case 'login':
    case 'session_start':
      return <LogIn size={16} color="var(--text-sub)" />
    default:
      return <History size={16} color="var(--text-sub)" />
  }
}

const formatActionLabel = (type: string) =>
  type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

const groupActivities = (items: LogItem[]) => {
  const groups: { label: string; items: LogItem[] }[] = []
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const weekAgo = today - 86400000 * 7

  items.forEach((item) => {
    const time = new Date(item.created_at).getTime()
    let label = 'Older'
    if (time >= today) label = 'Today'
    else if (time >= yesterday) label = 'Yesterday'
    else if (time >= weekAgo) label = 'Past Week'

    const existing = groups.find((g) => g.label === label)
    if (existing) existing.items.push(item)
    else groups.push({ label, items: [item] })
  })

  return groups
}

export default function ActivityLogView({
  userId,
  groupId,
  scope = 'group',
  limit = 50,
  showExport = false,
}: {
  userId?: string
  groupId?: string
  scope?: 'user' | 'group' | 'combined'
  limit?: number
  showExport?: boolean
}) {
  const [activities, setActivities] = useState<LogItem[]>([])
  const [logSearch, setLogSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { addToast } = useNotifications()
  const db = useMemo(() => createBrowserSupabaseClient(), [])

  const feedOpts = useMemo(() => {
    if (scope === 'combined' && userId) {
      return { userId, groupId: groupId ?? null, limit }
    }
    if (scope === 'user' && userId) return { userId, limit }
    if (scope === 'group' && groupId) return { groupId, limit }
    if (userId) return { userId, limit }
    if (groupId) return { groupId, limit }
    return {}
  }, [scope, userId, groupId, limit])

  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return activities
    const term = logSearch.toLowerCase()
    return activities.filter(
      (a) =>
        (a.description || '').toLowerCase().includes(term) ||
        (a.action_type || a.action || '').toLowerCase().includes(term) ||
        (a.user_name || '').toLowerCase().includes(term),
    )
  }, [activities, logSearch])

  const grouped = useMemo(() => groupActivities(filteredLogs), [filteredLogs])

  const fetchLogs = useCallback(async () => {
    if (!feedOpts.userId && !feedOpts.groupId) {
      setActivities([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const rows = await fetchActivityFeed(feedOpts)
      setActivities(
        rows.map((r) => ({
          ...r,
          profiles: {
            full_name: r.user_name ?? null,
            avatar_url: null,
          },
        })),
      )
    } catch (err) {
      console.error('Activity log fetch failed:', err)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [feedOpts])

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportLimit = Math.max(limit, 500)
      const rows = await fetchActivityFeed({ ...feedOpts, limit: exportLimit })
      const csv = buildActivityLogCsv(rows)
      const stamp = new Date().toISOString().split('T')[0]
      downloadTextFile(csv, `Espeezy_Activity_Log_${stamp}.csv`)
      addToast('Export ready', 'Activity log downloaded as CSV.', 'success')
    } catch {
      addToast('Export failed', 'Could not download activity log.', 'error')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    void fetchLogs()

    const channelName = `activity_feed_${userId ?? 'x'}_${groupId ?? 'x'}_${Date.now()}`
    const channel = db.channel(channelName)

    if (userId) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${userId}`,
        },
        () => void fetchLogs(),
      )
    }
    if (groupId) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `group_id=eq.${groupId}`,
        },
        () => void fetchLogs(),
      )
    }

    void channel.subscribe()

    return () => {
      db.removeChannel(channel)
    }
  }, [userId, groupId, feedOpts, db, fetchLogs])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-sub)' }}>
        Loading activity…
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sub)', background: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
        <History size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>No recent activity recorded.</p>
        {showExport && (
          <button
            type="button"
            className="btn btn-ghost btn-inline"
            style={{ marginTop: '1rem' }}
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-sub)',
            }}
          />
          <input
            type="text"
            placeholder="Search activity history..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '10px',
              background: 'var(--bg-main)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
            }}
          />
          {logSearch && (
            <button
              type="button"
              onClick={() => setLogSearch('')}
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
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        {showExport && (
          <button
            type="button"
            className="btn btn-ghost btn-inline print-hide"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            <Download size={14} /> {exporting ? 'Exporting…' : 'Download CSV'}
          </button>
        )}
      </div>

      {filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-sub)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
          No logs match &quot;{logSearch}&quot;
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {grouped.map((group) => (
            <div key={group.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Calendar size={14} color="var(--brand)" />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'var(--text-sub)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {group.label}
                </span>
              </div>

              <div
                style={{
                  position: 'relative',
                  paddingLeft: '2rem',
                  borderLeft: '2px solid var(--border)',
                  marginLeft: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {group.items.map((activity) => (
                  <div key={activity.id} style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-2.4rem',
                        top: '0.4rem',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'var(--surface)',
                        border: '2px solid var(--brand)',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div
                        style={{
                          padding: '0.5rem',
                          background: 'var(--bg-main)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {getActionIcon(activity.action_type || activity.action)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {activity.description || formatActionLabel(activity.action_type || activity.action)}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              color: 'var(--text-sub)',
                              fontSize: '0.75rem',
                              flexShrink: 0,
                            }}
                          >
                            <Clock size={12} />
                            {new Date(activity.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-sub)',
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>{activity.user_name || activity.profiles?.full_name || 'System'}</span>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {activity.group_id ? 'Team' : 'Personal'}
                          </span>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span style={{ fontSize: '0.7rem' }}>
                            {formatActionLabel(activity.action_type || activity.action)}
                          </span>
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
