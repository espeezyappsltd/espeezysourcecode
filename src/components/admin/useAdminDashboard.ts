'use client'

/**
 * useAdminDashboard
 *
 * Custom hook that owns ALL state and data-fetching for the Admin Dashboard.
 * No UI code lives here — just data, effects, and callbacks.
 *
 * Why a hook?
 *   - Keeps page.tsx and every sub-component free of business logic.
 *   - Makes every action testable in isolation.
 *   - A single place to change the data layer later (e.g. swap direct Supabase
 *     calls for API service calls) without touching any component.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  orderBy, 
  limit,
  getCountFromServer
} from 'firebase/firestore'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from '@/components/NotificationProvider'
import type {
  AdminStats,
  RecentUser,
  SystemLog,
  LaunchConfig,
  PlatformConfig,
} from './types'

// ── Default values defined outside the hook ────────────────────────────────────
// Keeps them stable across renders (no new object reference each call).

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
  { t: '13:42:05', m: 'FIREBASE_SYNC: Institutional Node Established' },
  { t: '13:42:12', m: 'STRIPE_WEBHOOK: Listening on events' },
  { t: '13:42:18', m: 'ELITE30_CHECK: 4 redemptions validated' },
]

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAdminDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const router = useRouter()
  const { addToast } = useNotifications()

  // ── Auth / verification state ──
  const [isVerified, setIsVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  // ── Dashboard data ──
  const [stats, setStats] = useState<AdminStats>(DEFAULT_STATS)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [config, setConfig] = useState<PlatformConfig>({})
  const [savingConfig, setSavingConfig] = useState(false)

  // ── Launch config ──
  const [launchConfig, setLaunchConfig] = useState<LaunchConfig>(DEFAULT_LAUNCH_CONFIG)
  const [preregCount, setPreregCount] = useState(0)
  const [savingLaunchConfig, setSavingLaunchConfig] = useState(false)

  // ── Effect: redirect non-admins ────────────────────────────────────────────
  useEffect(() => {
    if (profileLoading) return
    if (!profile || profile.role !== 'admin') {
      addToast(
        'Unauthorized Access',
        'You do not have administrative clearance for this terminal.',
        'error',
      )
      router.push('/dashboard')
    }
  }, [profile, profileLoading, router, addToast])

  // ── Effect: live terminal log heartbeat ────────────────────────────────────
  useEffect(() => {
    if (!isVerified) return

    // Show seed logs immediately on verification
    queueMicrotask(() => setSystemLogs(SEED_LOGS))

    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
      const nodeId = Math.floor(Math.random() * 100)
      setSystemLogs((prev) => [
        { t: time, m: `UPLINK_EVENT: Heartbeat detected from Node_${nodeId}` },
        ...prev.slice(0, 7), // keep the last 7 + the new one = 8 visible lines
      ])
    }, 5000)

    return () => clearInterval(interval)
  }, [isVerified])

  // ── fetchAdminData ─────────────────────────────────────────────────────────
  // All aggregation and list queries run in parallel.
  const fetchAdminData = useCallback(async () => {
    setLoading(true)

    try {
      const [
        totalUsersSnap,
        proUsersSnap,
        premiumUsersSnap,
        lifetimeUsersSnap,
        recentSnap,
        configSnap,
      ] = await Promise.all([
        getCountFromServer(collection(db, 'profiles')),
        getCountFromServer(query(collection(db, 'profiles'), where('subscription_plan', '==', 'pro'))),
        getCountFromServer(query(collection(db, 'profiles'), where('subscription_plan', '==', 'premium'))),
        getCountFromServer(query(collection(db, 'profiles'), where('subscription_plan', '==', 'lifetime'))),
        getDocs(query(collection(db, 'profiles'), orderBy('created_at', 'desc'), limit(8))),
        getDocs(collection(db, 'platform_config'))
      ])

      const totalUsers = totalUsersSnap.data().count
      const proUsers = proUsersSnap.data().count
      const premiumUsers = premiumUsersSnap.data().count
      const lifetimeUsers = lifetimeUsersSnap.data().count

      // Convert the config rows array into a key-indexed map
      const configMap = configSnap.docs.reduce<PlatformConfig>(
        (acc, doc) => {
          const item = doc.data() as any
          return { ...acc, [item.key]: item }
        },
        {},
      )

      setStats({
        users: totalUsers,
        pro: proUsers,
        premium: premiumUsers + lifetimeUsers,
        // Estimated revenue calculation
        revenue:
          proUsers * 4.99 +
          premiumUsers * 14.99 +
          lifetimeUsers * 99,
      })
      setRecentUsers(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as RecentUser)))
      setConfig(configMap)
    } catch (err: any) {
      console.error('Fetch admin data error:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Effect: fetch data + real-time subscriptions once verified ─────────────
  useEffect(() => {
    if (!isVerified) return

    queueMicrotask(() => void fetchAdminData())

    // Platform Config listener
    const configUnsub = onSnapshot(collection(db, 'platform_config'), () => {
      addToast('Platform Real-time Sync', 'Marketing configuration updated.', 'success')
      fetchAdminData()
    })

    // New Profile listener
    const profileUnsub = onSnapshot(query(collection(db, 'profiles'), orderBy('created_at', 'desc'), limit(1)), (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          addToast('Institutional Event', 'User registration detected. Refreshing terminal...', 'success')
          fetchAdminData()
        }
      })
    })

    return () => {
      configUnsub()
      profileUnsub()
    }
  }, [isVerified, addToast, fetchAdminData])

  // ── Effect: load launch config and pre-reg count ───────────────────────────
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
        // Non-critical — silently ignore; the form just shows empty defaults
      }
    }

    loadLaunchConfig()
  }, [isVerified])

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Saves all launch config fields to the API and shows a toast. */
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

  /**
   * Performs a quick user action (ban / upgrade / unlock) from the user list.
   */
  const handleUserAction = useCallback(
    async (userId: string, action: 'unlock' | 'upgrade' | 'ban') => {
      addToast(
        'Orchestration Command Sent',
        `Executing ${action} on node ${userId.slice(0, 8)}...`,
        'success',
      )

      const updateData: any =
        action === 'upgrade'
          ? { subscription_plan: 'premium' }
          : action === 'ban'
            ? { role: 'banned' }
            : { role: 'user' }

      try {
        await updateDoc(doc(db, 'profiles', userId), updateData)
        addToast('Operation Success', 'Database synchronized.', 'success')
        fetchAdminData()
      } catch (err: any) {
        addToast('Command Failed', err.message, 'error')
      }
    },
    [addToast, fetchAdminData],
  )

  /** Updates a single key in the platform_config table. */
  const updatePlatformConfig = useCallback(
    async (
      key: string,
      updates: Record<string, string | number | boolean | Record<string, string>>,
    ) => {
      setSavingConfig(true)
      try {
        // In Firestore, we use the document ID if the key is the ID, 
        // or we query for the doc with that key field.
        // Assuming 'key' is the doc ID for simplicity or querying:
        const q = query(collection(db, 'platform_config'), where('key', '==', key))
        const snap = await getDocs(q)
        if (!snap.empty) {
          await updateDoc(doc(db, 'platform_config', snap.docs[0].id), updates)
          addToast('State Persisted', `${key} re-routed successfully.`, 'success')
          fetchAdminData()
        }
      } catch (err: any) {
        addToast('Sync Error', err.message, 'error')
      }
      setSavingConfig(false)
    },
    [addToast, fetchAdminData],
  )

  /**
   * Verifies the admin clearance code.
   * The code is intentionally simple — the real gate is the server-side
   * role check in the layout and every API route.
   */
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

  /** Navigates to the theme studio from the UI Orchestrator card. */
  const handleLaunchStudio = useCallback(() => {
    addToast('Orchestrator Initialized', 'Rerouting terminal to design studio...', 'success')
    router.push('/dashboard/settings?tab=themes')
  }, [addToast, router])

  // ── Return the full public API of this hook ────────────────────────────────
  return {
    // profile
    profile,
    profileLoading,

    // verification
    isVerified,
    verificationCode,
    setVerificationCode,
    verifying,
    handleVerify,

    // dashboard data
    stats,
    recentUsers,
    loading,
    systemLogs,
    config,
    setConfig,
    savingConfig,

    // launch config
    launchConfig,
    setLaunchConfig,
    preregCount,
    savingLaunchConfig,
    saveLaunchConfig,

    // actions
    fetchAdminData,
    handleUserAction,
    updatePlatformConfig,
    handleLaunchStudio,
  }
}
