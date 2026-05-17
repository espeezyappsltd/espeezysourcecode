'use client'

import { Shield } from 'lucide-react'
import { useDevHubAdminSession } from './DevHubAdminSessionContext'

/** Shows signed-in admin username in the hub top bar (login is on /login). */
export function DevHubAdminBadge() {
  const { member } = useDevHubAdminSession()
  if (!member) return null

  return (
    <span className="dev-hub-admin-badge" title={member.email}>
      <Shield size={14} aria-hidden />
      {member.username}
    </span>
  )
}
