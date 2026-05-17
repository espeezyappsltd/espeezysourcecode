'use client'

import { useEffect, useRef, useState } from 'react'

const MIN_LANDING_MS = 1400
const AUTO_ENTER_MS = 4500

export function useHomePickupGate(workspaceReady: boolean) {
  const [phase, setPhase] = useState<'landing' | 'workspace'>('landing')
  const [minElapsed, setMinElapsed] = useState(false)
  const autoEntered = useRef(false)

  useEffect(() => {
    const t = window.setTimeout(() => setMinElapsed(true), MIN_LANDING_MS)
    return () => window.clearTimeout(t)
  }, [])

  const canEnter = minElapsed
  const readyToAutoEnter = minElapsed && workspaceReady

  useEffect(() => {
    if (!readyToAutoEnter || autoEntered.current) return
    const t = window.setTimeout(() => {
      autoEntered.current = true
      setPhase('workspace')
    }, AUTO_ENTER_MS - MIN_LANDING_MS)
    return () => window.clearTimeout(t)
  }, [readyToAutoEnter])

  const enterWorkspace = () => {
    autoEntered.current = true
    setPhase('workspace')
  }

  return {
    phase,
    canEnter,
    minElapsed,
    workspaceReady,
    enterWorkspace,
    isLanding: phase === 'landing',
  }
}
