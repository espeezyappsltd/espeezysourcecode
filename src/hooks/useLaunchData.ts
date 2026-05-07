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

export function useLaunchData() {
  const [config] = useState<LaunchConfig>({
    launch_date: '2026-05-09T00:00:00.000Z',
    launch_message: 'Something big is coming. Join 5 million students shaping the future of collaborative education.',
    preregister_goal: '5000000',
    brand_name: 'Espeezy',
  })
  const [registeredCount, setRegisteredCount] = useState(0)
  const [configLoaded] = useState(true)

  useEffect(() => {
    const withTimeout = async (timeoutMs = 3500) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch('/api/preregister', { signal: controller.signal, cache: 'no-store' })
        return res.ok ? await res.json() : null
      } catch {
        return null
      } finally {
        clearTimeout(timeoutId)
      }
    }

    const load = async () => {
      try {
        const countPayload = await withTimeout()
        const count = countPayload?.count
        if (typeof count === 'number') setRegisteredCount(count)
      } catch (_) {
        // Fallback to defaults
      }
    }
    load()
  }, [])

  const timeLeft = useCountdown(config.launch_date)

  return {
    config,
    registeredCount,
    configLoaded,
    timeLeft,
    setRegisteredCount,
  }
}
