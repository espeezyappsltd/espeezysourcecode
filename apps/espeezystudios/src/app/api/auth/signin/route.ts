import { NextResponse } from 'next/server'
import type { Provider } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  buildAuthCallbackUrl,
  ESPEEZY_APP_ORIGINS,
  resolveRequestOrigin,
  sanitizeNextPath,
} from '@shared/app-url'

export const dynamic = 'force-dynamic'

const SUPPORTED_PROVIDERS = new Set<Provider>(['google', 'github'])

function loginRedirect(origin: string, next: string, error?: string): NextResponse {
  const url = new URL('/login', origin)
  if (next && next !== '/') url.searchParams.set('next', next)
  if (error) url.searchParams.set('error', error)
  return NextResponse.redirect(url.toString())
}

/**
 * NextAuth-compatible sign-in entry (`/api/auth/signin?provider=google`).
 * This app authenticates via Supabase OAuth, so we translate the legacy
 * NextAuth URL into a server-side Supabase OAuth handshake and redirect to
 * the provider. Without a recognized provider we fall back to the login page.
 */
export async function GET(request: Request) {
  const origin = resolveRequestOrigin(request, ESPEEZY_APP_ORIGINS.studios)
  const { searchParams } = new URL(request.url)
  const next = sanitizeNextPath(searchParams.get('next'))
  const provider = searchParams.get('provider')?.toLowerCase() as Provider | undefined

  if (!provider || !SUPPORTED_PROVIDERS.has(provider)) {
    return loginRedirect(origin, next)
  }

  try {
    const supabase = await createClient()
    const callbackUrl = new URL(buildAuthCallbackUrl(origin))
    callbackUrl.searchParams.set('next', next)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl.toString(), skipBrowserRedirect: true },
    })

    if (error || !data?.url) {
      return loginRedirect(origin, next, error?.message ?? 'Unable to start sign-in.')
    }

    return NextResponse.redirect(data.url)
  } catch {
    return loginRedirect(origin, next, 'Unable to start sign-in.')
  }
}

export const POST = GET
