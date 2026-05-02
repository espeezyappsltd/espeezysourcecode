import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'


export async function GET() {
  const client_id = process.env.SPOTIFY_CLIENT_ID
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI

  if (!client_id || !redirect_uri) {
    return NextResponse.json({ error: 'Spotify integration not enabled' }, { status: 401 })
  }

  const scope = [
    'user-read-private',
    'user-read-email',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ')

  const state = Math.random().toString(36).substring(7)
  
  // Store state in a cookie for validation in callback
  const cookieStore = await cookies()
  cookieStore.set('spotify_auth_state', state, { httpOnly: true, secure: true })

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('client_id', client_id)
  authUrl.searchParams.append('scope', scope)
  authUrl.searchParams.append('redirect_uri', redirect_uri)
  authUrl.searchParams.append('state', state)

  return NextResponse.redirect(authUrl.toString())
}
