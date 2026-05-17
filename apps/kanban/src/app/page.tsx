
import { getAuthUser, getCachedUserGroupId } from '@/utils/auth-server'
import { redirect } from 'next/navigation'
import { HomePickupShell } from '@/features/home-pickup/HomePickupShell'
import WelcomeOnboarding from '@/components/WelcomeOnboarding'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const groupId = await getCachedUserGroupId(user.uid)

  if (!groupId) {
    return <WelcomeOnboarding />
  }

  return <HomePickupShell groupId={groupId} />
}
