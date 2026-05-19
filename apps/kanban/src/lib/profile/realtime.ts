import type { Profile } from '@/types/auth'

export type ProfileRealtimeClientStatus =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'polling'
  | 'unavailable'

export type ProfileRealtimeServerSetup = {
  in_realtime_publication: boolean
  replica_identity_full: boolean
}

export function profileRealtimeChannelName(userId: string) {
  return `profile:${userId}`
}

/** Realtime UPDATE payloads may be partial unless REPLICA IDENTITY FULL is set. */
export function mergeProfileRealtimePayload(
  previous: Profile | null,
  incoming: Record<string, unknown>,
): Profile | null {
  const id = typeof incoming.id === 'string' ? incoming.id : null
  if (!id) return previous

  if (previous?.id === id) {
    return { ...previous, ...incoming } as Profile
  }

  return incoming as Profile
}

export function isProfileRealtimeServerReady(setup: ProfileRealtimeServerSetup | null | undefined) {
  if (!setup) return false
  return setup.in_realtime_publication && setup.replica_identity_full
}

export function mapSupabaseChannelStatus(
  status: string,
): ProfileRealtimeClientStatus {
  switch (status) {
    case 'SUBSCRIBED':
      return 'live'
    case 'CHANNEL_ERROR':
    case 'TIMED_OUT':
    case 'CLOSED':
      return 'unavailable'
    case 'JOINING':
    case 'JOINED':
      return 'connecting'
    default:
      return 'connecting'
  }
}
