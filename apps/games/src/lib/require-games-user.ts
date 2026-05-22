import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Returns authenticated Supabase client + user, or a 401 response. */
export async function requireGamesUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase: null, user: null, unauthorized: NextResponse.json({ error: 'Sign in to add games.' }, { status: 401 }) }
  }

  return { supabase, user, unauthorized: null as null }
}
