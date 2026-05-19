import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchProfileTier, hasGamesAccess } from '@/lib/games-tier'

export const dynamic = 'force-dynamic'

/** Cookie-session tier check for login redirect (avoids free-tier redirect loops). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ hasAccess: false, tier: 'free' as const }, { status: 401 })
  }

  const tier = await fetchProfileTier(supabase, user.id)
  return NextResponse.json({ hasAccess: hasGamesAccess(tier), tier })
}
