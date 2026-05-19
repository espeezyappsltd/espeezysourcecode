export const CONTRIBUTION_SCORES_UPDATED = 'espeezy-contribution-scores-updated'

export function dispatchContributionScoresUpdated(groupId: string, userIds?: string[]) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(CONTRIBUTION_SCORES_UPDATED, {
      detail: { groupId, userIds: userIds ?? [] },
    }),
  )
}
