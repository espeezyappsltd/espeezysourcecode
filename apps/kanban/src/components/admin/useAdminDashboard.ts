'use client'

/**
 * useAdminDashboard
 *
 * Custom hook that owns ALL state and data-fetching for the Admin Dashboard.
 * No UI code lives here  -  just data, effects, and callbacks.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Q } from '@/lib/query-columns'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from '@/components/NotificationProvider'
import type {
  AdminStats,
  RecentUser,
  SystemLog,
  LaunchConfig,
  PlatformConfig,
  ConfigEntry,
} from './types'

const DEFAULT_STATS: AdminStats = { users: 0, pro: 0, premium: 0, revenue: 0 }

const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  launch_date: '',
  launch_message: '',
  preregister_goal: '',
  preregister_open: 'true',
  brand_name: '',
  platform_version: '',
}

const SEED_LOGS: SystemLog[] = [
  { t: '13:42:01', m: 'AUTH_GATEWAY: [200] OK' },
  { t: '13:42:05', m: 'DATABASE_UPLINK: Supabase Node Established' },
  { t: '13:42:12', m: 'STRIPE_WEBHOOK: Listening on events' },
  { t: '13:42:18', m: 'ELITE30_CHECK: 4 redemptions validated' },
]

export function useAdminDashboard() {
  const db = useMemo(() => createClient(), [])
  const { profile, loading: profileLoading } = useProfile()
  const router = useRouter()
  const { addToast } = useNotifications()

  const [isVerified, setIsVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  const [stats, setStats] = useState<AdminStats>(DEFAULT_STATS)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [config, setConfig] = useState<PlatformConfig>({})
  const [savingConfig, setSavingConfig] = useState(false)

  const [launchConfig, setLaunchConfig] = useState<LaunchConfig>(DEFAULT_LAUNCH_CONFIG)
  const [preregCount, setPreregCount] = useState(0)
  const [savingLaunchConfig, setSavingLaunchConfig] = useState(false)

  useEffect(() => {
    if (profileLoading) return
    if (!profile || profile.role !== 'admin') {
      addToast(
        'Unauthorized Access',
        'You do not have administrative clearance for this terminal.',
        'error',
      )
      router.push('/')
    }
  }, [profile, profileLoading, router, addToast])

  useEffect(() => {
    if (!isVerified) return

    queueMicrotask(() => setSystemLogs(SEED_LOGS))

    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
      const nodeId = Math.floor(Math.random() * 100)
      setSystemLogs((prev) => [
        { t: time, m: `UPLINK_EVENT: Heartbeat detected from Node_${nodeId}` },
        ...prev.slice(0, 7),
      ])
    }, 5000)

    return () => clearInterval(interval)
  }, [isVerified])

  const fetchAdminData = useCallback(async () => {
    setLoading(true)

    try {
      const [
        totalUsersCount,
        proUsersCount,
        premiumUsersCount,
        lifetimeUsersCount,
        recentRes,
        configRes,
      ] = await Promise.all([
        db.from('profiles').select('*', { count: 'exact', head: true }),
        db.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_plan', 'pro'),
        db.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_plan', 'premium'),
        db.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_plan', 'lifetime'),
        db.from('profiles').select(Q.profile.recentAdmin).order('created_at', { ascending: false }).limit(8),
        db.from('platform_config').select(Q.platformConfig),
      ])

      const totalUsers = totalUsersCount.count || 0
      const proUsers = proUsersCount.count || 0
      const premiumUsers = premiumUsersCount.count || 0
      const lifetimeUsers = lifetimeUsersCount.count || 0

      const configMap = (configRes.data || []).reduce<PlatformConfig>(
        (acc, item) => {
          return { ...acc, [item.key as string]: item as unknown as ConfigEntry }
        },
        {} as PlatformConfig,
      )

      const revenue = proUsers * 4.99 + premiumUsers * 14.99 + lifetimeUsers * 99
      const arpu = totalUsers > 0 ? revenue / totalUsers : 0
      const grossMargin = 0.8
      const churnRate = 0.03
      const ltv = churnRate > 0 ? Math.round((arpu * grossMargin) / churnRate) : 0
      const cac = 25
      const nrr = 0.92

      setStats({
        users: totalUsers,
        pro: proUsers,
        premium: premiumUsers + lifetimeUsers,
        revenue,
        ltv,
        cac,
        nrr,
      })
      setRecentUsers((recentRes.data || []).map((d) => d as unknown as RecentUser))
      setConfig(configMap)
    } catch (err) {
      console.error('Fetch admin data error:', err instanceof Error ? err.message : err)
    } finally {
      setLoading(false)
    }
  }, [db])

  useEffect(() => {
    if (!isVerified) return

    queueMicrotask(() => void fetchAdminData())

    const configChannel = db
      .channel('platform_config_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_config' }, () => {
        addToast('Platform Real-time Sync', 'Marketing configuration updated.', 'success')
        fetchAdminData()
      })
      .subscribe()

    const profileChannel = db
      .channel('profile_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        addToast('Institutional Event', 'User registration detected. Refreshing terminal...', 'success')
        fetchAdminData()
      })
      .subscribe()

    return () => {
      db.removeChannel(configChannel)
      db.removeChannel(profileChannel)
    }
  }, [isVerified, addToast, fetchAdminData, db])

  useEffect(() => {
    if (!isVerified) return

    async function loadLaunchConfig() {
      try {
        const [cfgRes, countRes] = await Promise.all([
          fetch('/api/admin/launch-config'),
          fetch('/api/preregister'),
        ])
        const { config: cfg } = await cfgRes.json()
        const { count } = await countRes.json()
        if (cfg) setLaunchConfig((prev) => ({ ...prev, ...cfg }))
        setPreregCount(count ?? 0)
      } catch {
        // Non-critical
      }
    }

    loadLaunchConfig()
  }, [isVerified])

  const saveLaunchConfig = useCallback(async () => {
    setSavingLaunchConfig(true)
    try {
      const updates = Object.entries(launchConfig).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/launch-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        addToast('Launch Config Saved', 'Pre-registration page updated live.', 'success')
      } else {
        addToast('Save Failed', 'Could not update launch configuration.', 'error')
      }
    } catch {
      addToast('Network Error', 'Failed to save configuration.', 'error')
    }
    setSavingLaunchConfig(false)
  }, [launchConfig, addToast])

  const handleUserAction = useCallback(
    async (userId: string, action: 'unlock' | 'upgrade' | 'ban') => {
      addToast(
        'Orchestration Command Sent',
        `Executing ${action} on node ${userId.slice(0, 8)}...`,
        'success',
      )

      const updateData: Record<string, unknown> =
        action === 'upgrade'
          ? { subscription_plan: 'premium' }
          : action === 'ban'
            ? { role: 'banned' }
            : { role: 'user' }

      try {
        const { error } = await db.from('profiles').update(updateData).eq('id', userId)
        if (error) throw error
        addToast('Operation Success', 'Database synchronized.', 'success')
        fetchAdminData()
      } catch (err) {
        addToast('Command Failed', err instanceof Error ? err.message : String(err), 'error')
      }
    },
    [addToast, fetchAdminData, db],
  )

  const updatePlatformConfig = useCallback(
    async (
      key: string,
      updates: Record<string, string | number | boolean | Record<string, string>>,
    ) => {
      setSavingConfig(true)
      try {
        const { error } = await db.from('platform_config').update(updates).eq('key', key)
        if (error) throw error
        addToast('State Persisted', `${key} re-routed successfully.`, 'success')
        fetchAdminData()
      } catch (err) {
        addToast('Sync Error', err instanceof Error ? err.message : String(err), 'error')
      }
      setSavingConfig(false)
    },
    [addToast, fetchAdminData, db],
  )

  const handleVerify = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setVerifying(true)
      setTimeout(() => {
        if (verificationCode === '2026-ADMIN') {
          setIsVerified(true)
          addToast('Identity Verified', 'Administrative session established.', 'success')
        } else {
          addToast(
            'Verification Failed',
            'Invalid clearance code. Retry limit approaching.',
            'error',
          )
        }
        setVerifying(false)
      }, 1200)
    },
    [verificationCode, addToast],
  )

  const handleLaunchStudio = useCallback(() => {
    addToast('Orchestrator Initialized', 'Rerouting terminal to design studio...', 'success')
    router.push('/settings?tab=themes')
  }, [addToast, router])

  return {
    profile,
    profileLoading,
    isVerified,
    verificationCode,
    setVerificationCode,
    verifying,
    handleVerify,
    stats,
    recentUsers,
    loading,
    systemLogs,
    config,
    setConfig,
    savingConfig,
    launchConfig,
    setLaunchConfig,
    preregCount,
    savingLaunchConfig,
    saveLaunchConfig,
    fetchAdminData,
    handleUserAction,
    updatePlatformConfig,
    handleLaunchStudio,
  }
}
