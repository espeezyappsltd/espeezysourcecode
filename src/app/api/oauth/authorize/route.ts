import { NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
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
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const token = authHeader.split('Bearer ')[1]
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  if (!adminAuth || !adminDb) return NextResponse.json({ error: 'server_error' }, { status: 503 })

  const decodedToken = await adminAuth.verifyIdToken(token).catch(() => null)
  if (!decodedToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const uid = decodedToken.uid

  // 2. Validate request body
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', details: parsed.error.flatten() }, { status: 422 })
  }
  const { client_id, redirect_uri, scope, state, approved } = parsed.data

  // 3. Re-validate client and redirect_uri server-side
  const clientSnap = await adminDb.collection('oauth_clients').doc(client_id).get().catch(() => null)
  if (!clientSnap || !clientSnap.exists) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 })
  }
  const client = clientSnap.data()!
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

  await adminDb.collection('oauth_auth_codes').doc(code).set({
    code,
    client_id,
    uid,
    scope: grantedScopes.join(' '),
    redirect_uri,
    expires_at: expiresAt,
    used: false,
    created_at: new Date().toISOString(),
  })

  redirectUrl.searchParams.set('code', code)
  if (state) redirectUrl.searchParams.set('state', state)

  return NextResponse.json({ redirect: redirectUrl.toString() })
}
