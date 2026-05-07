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

export function useCountdown(targetDate: string): TimeLeft {
  const calc = useCallback(() => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    }
  }, [targetDate])

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calc)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calc()), 1000)
    return () => clearInterval(id)
  }, [calc])

  return timeLeft
}

const twoWeeksFromNowISO = new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString()

const DEFAULTS: LaunchConfig = {
  launch_date: twoWeeksFromNowISO,
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
            launch_date: twoWeeksFromNowISO,
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
