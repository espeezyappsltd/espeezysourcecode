import { getAuthUser, getUserProfile } from '@/utils/auth-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardHome from '@/components/DashboardHome'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getAuthUser()
  
  if (!user) redirect('/login')

  const profile: any = await getUserProfile(user.uid)

  if (!profile?.group_id) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em' }}>Academic Hub Active</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem', fontWeight: 600, fontSize: '1.1rem' }}>You are currently unassigned. Please join an existing project or create a new team to begin.</p>
        
        <Link href="/dashboard/join" className="btn btn-primary" style={{ padding: '1rem 2.5rem', width: 'auto', fontSize: '1.1rem', borderRadius: '16px', fontWeight: 900 }}>
           Join or Create Team
        </Link>
      </div>
    )
  }

  return <DashboardHome groupId={profile.group_id} />
}
