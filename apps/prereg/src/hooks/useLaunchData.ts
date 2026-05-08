'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LaunchConfig, TimeLeft } from '@shared-types/launch'

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

// Fixed launch date — update manually when the date changes
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
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [cfgRes, countRes] = await Promise.all([
          fetch('/api/launch-config'),
          fetch('/api/preregister'),
        ])
        const { config: cfg } = await cfgRes.json()
        const { count } = await countRes.json()
        if (cfg) {
          setConfig(prev => ({
            ...prev,
            ...cfg,
            launch_date: cfg.launch_date ?? DEFAULT_LAUNCH_DATE,
            preregister_goal: '5000',
          }))
        }
        if (count) setRegisteredCount(count)
      } catch (_) {
        // Use defaults on failure
      }
      setConfigLoaded(true)
    }
    load()
  }, [])

  const timeLeft = useCountdown(config.launch_date)

  return { config, registeredCount, configLoaded, timeLeft, setRegisteredCount }
}
