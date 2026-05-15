
import { getAuthUser, getUserProfile } from '@/utils/auth-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardHome from '@/components/DashboardHome'
import WelcomeOnboarding from '@/components/WelcomeOnboarding'
import type { Profile } from '@/types/auth'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile: Profile | null = await getUserProfile(user.uid)

  if (!profile?.group_id) {
    return <WelcomeOnboarding profile={profile as Profile} />
  }

  return <DashboardHome groupId={profile.group_id} />
}
