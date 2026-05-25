
import { createServerSupabaseClient } from '@/lib/supabase/client'

/**
 * Smart waterfall for team creation, switching, and leaving.
 * Ensures teams and team_members tables are always up-to-date.
 */
export async function createOrSwitchTeam(userId: string, teamName: string) {
  const db = createServerSupabaseClient()

  // 1. Create team if not exists
  const { data: team, error: teamError } = await db
    .from('teams')
    .upsert([{ name: teamName, created_by: userId }], { onConflict: 'name' })
    .select()
    .single()

  if (teamError || !team) throw teamError || new Error('Team creation failed')

  // 2. Remove user from all other teams (if switching)
  await db
    .from('team_members')
    .delete()
    .eq('user_id', userId)
    .neq('team_id', team.id)

  // 3. Add user to the new team (if not already)
  await db
    .from('team_members')
    .upsert([{ team_id: team.id, user_id: userId, role: 'owner' }], { onConflict: 'team_id,user_id' })

  return team
}

export async function leaveTeam(userId: string, teamId: string) {
  const db = createServerSupabaseClient()
  await db
    .from('team_members')
    .delete()
    .eq('user_id', userId)
    .eq('team_id', teamId)
}
