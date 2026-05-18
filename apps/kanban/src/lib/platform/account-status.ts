/** Profile states that block creating content (feed, gigs, etc.). */
const BLOCKED_ACCOUNT_STATUSES = new Set(['suspended', 'deactivated', 'banned'])

export function isAccountPostingBlocked(accountStatus: string | null | undefined): boolean {
  if (!accountStatus) return false
  return BLOCKED_ACCOUNT_STATUSES.has(accountStatus)
}

export function accountPostingBlockedMessage(accountStatus: string | null | undefined): string {
  if (accountStatus === 'suspended') {
    return 'Your account has been suspended. Contact support.'
  }
  if (accountStatus === 'deactivated') {
    return 'Your account is deactivated. Reactivate your profile to post.'
  }
  if (accountStatus === 'banned') {
    return 'Your account cannot post on the public feed.'
  }
  return 'Your account cannot post right now. Contact support.'
}
