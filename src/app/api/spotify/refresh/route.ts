import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'


export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'User ID missing' }, { status: 400 })

    const db = await createAdminClient()
    const { data: profile, error: fetchError } = await db
      .from('profiles')
      .select('spotify_refresh_token')
      .eq('id', userId)
      .single()

    if (fetchError || !profile?.spotify_refresh_token) {
      return NextResponse.json({ error: 'Refresh token not found' }, { status: 404 })
    }

    const client_id = process.env.SPOTIFY_CLIENT_ID
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: profile.spotify_refresh_token
      })
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error_description }, { status: 400 })
    }

    // New refresh token is optional – Spotify might not return a new one if it hasn't changed.
    const updates: Record<string, unknown> = {
      spotify_access_token: data.access_token,
      spotify_token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
    }

    if (data.refresh_token) {
      updates.spotify_refresh_token = data.refresh_token
    }

    const { error: updateError } = await db
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (updateError) throw updateError

    return NextResponse.json({ access_token: data.access_token })
  } catch (err: unknown) {
    console.error('Spotify Refresh Route Error:', err)
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
