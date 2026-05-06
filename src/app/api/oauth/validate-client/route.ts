import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  client_id: z.string().uuid(),
  redirect_uri: z.string().url().max(500),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    client_id: searchParams.get('client_id'),
    redirect_uri: searchParams.get('redirect_uri'),
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing or invalid client_id or redirect_uri' },
      { status: 400 },
    )
  }

  const { client_id, redirect_uri } = parsed.data
  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: 'server_error' }, { status: 503 })

  const snap = await db.collection('oauth_clients').doc(client_id).get().catch(() => null)
  if (!snap || !snap.exists) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Unknown client_id' },
      { status: 400 },
    )
  }

  const client = snap.data()!
  const allowedUris: string[] = client.allowed_redirect_uris ?? []
  if (!allowedUris.includes(redirect_uri)) {
    return NextResponse.json(
      { error: 'invalid_redirect_uri', error_description: 'redirect_uri not registered for this client' },
      { status: 400 },
    )
  }

  return NextResponse.json({
    client_id,
    client_name: client.client_name as string,
    logo_url: (client.logo_url as string) ?? null,
    allowed_scopes: (client.allowed_scopes as string[]) ?? [],
  })
}
