import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  const cookieStore = await cookies()
  const storedState = cookieStore.get('spotify_auth_state')?.value

  if (state === null || state !== storedState) {
    return NextResponse.redirect('/dashboard/settings?error=state_mismatch')
  }

  cookieStore.delete('spotify_auth_state')

  const client_id = process.env.SPOTIFY_CLIENT_ID
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI

  if (!code || !client_id || !client_secret || !redirect_uri) {
    return NextResponse.redirect('/dashboard/settings?error=missing_params')
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
    },
    body: new URLSearchParams({
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    })
  })

  const tokens = await tokenResponse.json()

  if (tokens.error) {
    console.error('Spotify token exchange error:', tokens.error)
    return NextResponse.redirect(`/dashboard/settings?error=token_exchange_failed&msg=${tokens.error_description}`)
  }

  // Save tokens to Supabase
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) {
    return NextResponse.redirect('/login?error=unauthorized')
  }

  const { error: updateError } = await db
    .from('profiles')
    .update({
      spotify_access_token: tokens.access_token,
      spotify_refresh_token: tokens.refresh_token,
      spotify_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      spotify_connected: true
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Supabase update error:', updateError)
    return NextResponse.redirect('/dashboard/settings?error=database_update_failed')
  }

  return NextResponse.redirect('/dashboard/settings?spotify=connected')
}
