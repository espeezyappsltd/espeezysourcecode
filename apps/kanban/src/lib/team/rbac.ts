/** Team-scoped roles stored on `profiles.role`. */
export const TEAM_ROLES = ['admin', 'team_leader', 'collaborator', 'member'] as const
export type TeamRole = (typeof TEAM_ROLES)[number]

export function normalizeTeamRole(role: string | null | undefined): TeamRole {
  const r = (role ?? 'member').toLowerCase()
  if (r === 'admin') return 'admin'
  if (r === 'team_leader' || r === 'team leader') return 'team_leader'
  if (r === 'collaborator') return 'collaborator'
  return 'member'
}

export function teamRoleLabel(role: string | null | undefined): string {
  const r = normalizeTeamRole(role)
  if (r === 'admin') return 'Admin'
  if (r === 'team_leader') return 'Team lead'
  if (r === 'collaborator') return 'Member'
  return 'Member'
}

/** Can approve/decline join requests. */
export function canManageJoinRequests(role: string | null | undefined): boolean {
  const r = normalizeTeamRole(role)
  return r === 'admin' || r === 'team_leader'
}

/** Can remove members from the team (not other admins). */
export function canKickMembers(role: string | null | undefined): boolean {
  return canManageJoinRequests(role)
}

/** Can toggle encryption / destructive team settings. */
export function canManageTeamSettings(role: string | null | undefined): boolean {
  return normalizeTeamRole(role) === 'admin'
}

export function canKickTarget(actorRole: string | null | undefined, targetRole: string | null | undefined): boolean {
  if (!canKickMembers(actorRole)) return false
  return normalizeTeamRole(targetRole) !== 'admin'
}
