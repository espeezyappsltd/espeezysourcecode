import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import HomeLanding from '@/components/HomeLanding'
import { HUB_SESSION_COOKIE, verifyHubSession } from '@/lib/dev-hub/auth'

export default async function Home() {
  if (process.env.NODE_ENV !== 'production') {
    const jar = await cookies()
    if (verifyHubSession(jar.get(HUB_SESSION_COOKIE)?.value)) {
      redirect('/dashboard')
    }
  }
  return <HomeLanding />
}
