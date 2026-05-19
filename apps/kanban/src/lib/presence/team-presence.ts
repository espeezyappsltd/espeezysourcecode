/** How recently a user must have heartbeated to count as online (matches dashboard roster). */
export const PRESENCE_ONLINE_WINDOW_MS = 120_000

export function countTeamMembersOnline(memberIds: Iterable<string>, onlineUsers: Set<string>): number {
  let count = 0
  for (const id of memberIds) {
    if (onlineUsers.has(id)) count += 1
  }
  return count
}
