import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadGamesProfile } from '@/lib/profile/load-games-profile'
import GamesProfileClient from '@/app/profile/GamesProfileClient'

export const dynamic = 'force-dynamic'

export default async function GamesProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/profile')
  }

  const data = await loadGamesProfile(supabase, user.id)

  if (!data) {
    redirect('/login?next=/profile')
  }

  return <GamesProfileClient data={data} />
}
