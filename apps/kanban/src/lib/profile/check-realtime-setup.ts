import { getAdminDb } from '@/lib/supabase/admin'
import type { ProfileRealtimeServerSetup } from '@/lib/profile/realtime'

type RpcRow = ProfileRealtimeServerSetup

export async function fetchProfilesRealtimeServerSetup(): Promise<{
  setup: ProfileRealtimeServerSetup | null
  error: string | null
  migrationRequired: string | null
}> {
  const adminDb = getAdminDb()

  const { data, error } = await adminDb.rpc('check_profiles_realtime_setup')

  if (error) {
    const missingFn =
      error.message.includes('check_profiles_realtime_setup') &&
      (error.message.includes('does not exist') || error.code === 'PGRST202' || error.code === '42883')

    if (missingFn) {
      return {
        setup: null,
        error: null,
        migrationRequired:
          'Apply migrations 20260521130000_profiles_realtime.sql and 20260521140000_profiles_realtime_health.sql on Supabase.',
      }
    }

    return { setup: null, error: error.message, migrationRequired: null }
  }

  const row = data as RpcRow | null
  const setup: ProfileRealtimeServerSetup = {
    in_realtime_publication: Boolean(row?.in_realtime_publication),
    replica_identity_full: Boolean(row?.replica_identity_full),
  }

  let migrationRequired: string | null = null
  if (!setup.in_realtime_publication || !setup.replica_identity_full) {
    migrationRequired = 'Apply migration 20260521130000_profiles_realtime.sql on Supabase (REPLICA IDENTITY FULL + publication).'
  }

  return { setup, error: null, migrationRequired }
}
