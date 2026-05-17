'use client'

import { useCallback, useState } from 'react'
import DashboardHome from '@/components/DashboardHome'
import { HomePickupDashboard } from './HomePickupDashboard'
import { useHomePickupGate } from './useHomePickupGate'
import './home-pickup.css'

type Props = {
  groupId: string
}

export function HomePickupShell({ groupId }: Props) {
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const [exiting, setExiting] = useState(false)
  const { isLanding, canEnter, enterWorkspace } = useHomePickupGate(workspaceReady)

  const handleEnter = useCallback(() => {
    if (!isLanding) return
    setExiting(true)
    window.setTimeout(() => enterWorkspace(), 320)
  }, [enterWorkspace, isLanding])

  return (
    <>
      {isLanding && (
        <HomePickupDashboard
          groupId={groupId}
          workspaceReady={workspaceReady}
          canEnter={canEnter}
          exiting={exiting}
          onEnter={handleEnter}
        />
      )}
      <div className={isLanding ? 'home-pickup-preload' : undefined} aria-hidden={isLanding}>
        <DashboardHome groupId={groupId} onWorkspaceReady={() => setWorkspaceReady(true)} />
      </div>
    </>
  )
}
