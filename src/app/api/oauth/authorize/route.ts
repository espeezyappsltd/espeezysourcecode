import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { z } from 'zod'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Scopes supported by the Espeezy platform
const VALID_SCOPES = ['profile:read', 'tasks:read', 'tasks:write', 'projects:read', 'feed:read']

const bodySchema = z.object({
  client_id: z.string().uuid(),
  redirect_uri: z.string().url().max(500),
  scope: z.string().max(200),
  state: z.string().max(256).optional(),
  approved: z.boolean(),
})

export async function POST(req: Request) {
  // 1. Authenticate the user
  const user = await getRequestUser(req)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const adminDb = getAdminDb()
  const uid = user.id

  // 2. Validate request body
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', details: parsed.error.flatten() }, { status: 422 })
  }
  const { client_id, redirect_uri, scope, state, approved } = parsed.data

  // 3. Re-validate client and redirect_uri server-side
  const { data: client, error: clientError } = await adminDb
    .from('oauth_clients')
    .select('id, client_id, allowed_redirect_uris, allowed_scopes')
    .or(`id.eq.${client_id},client_id.eq.${client_id}`)
    .single()
  if (clientError || !client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 })
  }
  if (!(client.allowed_redirect_uris as string[] ?? []).includes(redirect_uri)) {
    return NextResponse.json({ error: 'invalid_redirect_uri' }, { status: 400 })
  }

  const redirectUrl = new URL(redirect_uri)

  // 4. Handle denial
  if (!approved) {
    redirectUrl.searchParams.set('error', 'access_denied')
    redirectUrl.searchParams.set('error_description', 'User denied access')
    if (state) redirectUrl.searchParams.set('state', state)
    return NextResponse.json({ redirect: redirectUrl.toString() })
  }

  // 5. Filter scopes to only those both requested and allowed for this client
  const requestedScopes = scope.split(/[\s,]+/).filter(Boolean)
  const allowedScopes: string[] = (client.allowed_scopes as string[]) ?? []
  const grantedScopes = requestedScopes.filter(s => VALID_SCOPES.includes(s) && allowedScopes.includes(s))

  // 6. Generate one-time auth code (expires in 10 minutes)
  const code = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: insertError } = await adminDb.from('oauth_auth_codes').insert({
    code,
    client_id,
    uid,
    scope: grantedScopes.join(' '),
    redirect_uri,
    expires_at: expiresAt,
    used: false,
  })
  if (insertError) {
    return NextResponse.json({ error: 'server_error', details: insertError.message }, { status: 500 })
  }

  redirectUrl.searchParams.set('code', code)
  if (state) redirectUrl.searchParams.set('state', state)

  return NextResponse.json({ redirect: redirectUrl.toString() })
}
