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

function useCountdown(targetDate: string): TimeLeft {
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
    launch_date: process.env.NEXT_PUBLIC_LAUNCH_DATE ?? '2026-12-31T00:00:00.000Z',
    launch_message:
      process.env.NEXT_PUBLIC_LAUNCH_MESSAGE ??
      'Join the waitlist and get priority access when Espeezy launches.',
    preregister_goal: process.env.NEXT_PUBLIC_PREREG_GOAL ?? '5000000',
    brand_name: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Espeezy',
  })
  const [registeredCount, setRegisteredCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/preregister', { cache: 'no-store' })
        if (!res.ok) return
        const payload = await res.json()
        if (typeof payload?.count === 'number') setRegisteredCount(payload.count)
      } catch {
        // Ignore count errors and keep defaults.
      }
    }
    void load()
  }, [])

  const timeLeft = useCountdown(config.launch_date)

  return { config, registeredCount, timeLeft, setRegisteredCount }
}
