'use client'

import { useState, useEffect, useCallback } from 'react'

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export interface LaunchConfig {
  launch_date: string
  launch_message: string
  preregister_goal: string
  brand_name: string
}

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

  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch('/api/preregister')
      const { count } = await res.json()
      if (typeof count === 'number') setRegisteredCount(count)
    } catch {
      // silently ignore
    }
  }, [])

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
        if (typeof count === 'number') setRegisteredCount(count)
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

  return { config, registeredCount, configLoaded, timeLeft, setRegisteredCount, refreshCount }
}
