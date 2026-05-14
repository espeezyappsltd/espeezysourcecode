'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LaunchConfig, TimeLeft } from '../types/launch'
import { fetchLaunchConfig, fetchLiveMetrics } from '../services/launch'

const ZERO_TIME: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }

export function useCountdown(targetDate: string): TimeLeft {
  const calc = useCallback(() => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return ZERO_TIME
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    }
  }, [targetDate])

  // Start with zeros so SSR and client initial render match, then hydrate on client
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(ZERO_TIME)

  useEffect(() => {
    setTimeLeft(calc())
    const id = setInterval(() => setTimeLeft(calc()), 1000)
    return () => clearInterval(id)
  }, [calc])

  return timeLeft
}

// Fixed launch date - update manually when the date changes
const DEFAULT_LAUNCH_DATE = '2026-06-01T00:00:00.000Z'

const DEFAULTS: LaunchConfig = {
  launch_date: DEFAULT_LAUNCH_DATE,
  launch_message: 'Something big is coming. Join the first 5,000 students shaping the future of collaborative education.',
  preregister_goal: '5000',
  brand_name: 'Espeezy',
}

export function useLaunchData() {
  const [config, setConfig] = useState<LaunchConfig>(DEFAULTS)
  const [registeredCount, setRegisteredCount] = useState(0)
  const [authUserCount, setAuthUserCount] = useState(0)
  const [configLoaded, setConfigLoaded] = useState(false)

  const setCountAndPersist = useCallback((count: number) => {
    setRegisteredCount(count)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('espeezy_last_registered_count', String(count))
    }
  }, [])

  const refreshCount = useCallback(async () => {
    try {
      const data = await fetchLiveMetrics()
      if (!data) return
      if (typeof data.preregistration_count === 'number') {
        setCountAndPersist(data.preregistration_count)
      } else if (typeof data.registered_count === 'number') {
        setCountAndPersist(data.registered_count)
      }
      if (typeof data.auth_user_count === 'number') {
        setAuthUserCount(data.auth_user_count)
      }
    } catch {
      // Keep previous value if live refresh fails.
    }
  }, [setCountAndPersist])

  useEffect(() => {
    const load = async () => {
      if (typeof window !== 'undefined') {
        const cached = Number(window.localStorage.getItem('espeezy_last_registered_count') ?? '0')
        if (Number.isFinite(cached) && cached > 0) {
          setRegisteredCount(cached)
        }
      }

      try {
        const [cfgPayload, metrics] = await Promise.all([
          fetchLaunchConfig(),
          fetchLiveMetrics(),
        ])
        const cfg = cfgPayload?.config
        if (cfg) {
          setConfig(prev => ({
            ...prev,
            ...cfg,
            launch_date: typeof cfg.launch_date === 'string' ? cfg.launch_date : DEFAULT_LAUNCH_DATE,
            preregister_goal: '5000',
          }))
        }
        if (!metrics) {
          setConfigLoaded(true)
          return
        }
        if (typeof metrics.preregistration_count === 'number') {
          setCountAndPersist(metrics.preregistration_count)
        } else if (typeof metrics.registered_count === 'number') {
          setCountAndPersist(metrics.registered_count)
        }
        if (typeof metrics.auth_user_count === 'number') {
          setAuthUserCount(metrics.auth_user_count)
        }
      } catch {
        // Use defaults on failure
      }
      setConfigLoaded(true)
    }
    load()

    // Poll every 30s so count stays fresh
    const pollId = setInterval(refreshCount, 30_000)
    // Re-fetch when the tab regains focus (e.g. returning from Stripe)
    window.addEventListener('focus', refreshCount)
    return () => {
      clearInterval(pollId)
      window.removeEventListener('focus', refreshCount)
    }
  }, [refreshCount])

  const timeLeft = useCountdown(config.launch_date)

  return { config, registeredCount, authUserCount, configLoaded, timeLeft, setRegisteredCount, refreshCount }
}
