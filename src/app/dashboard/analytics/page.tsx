import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function AnalyticsRedirect() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await db
    .from('profiles')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (profile?.group_id) {
    redirect(`/dashboard/analytics/${profile.group_id}`)
  } else {
    // If no group, send to network to find one
    redirect('/dashboard/network')
  }
}
