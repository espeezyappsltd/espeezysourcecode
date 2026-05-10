'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'

// ─── Scope metadata ───────────────────────────────────────────────────────────
const SCOPE_LABELS: Record<string, { label: string; description: string }> = {
  'profile:read':   { label: 'View your profile',       description: 'Read your name, avatar, and public profile info' },
  'tasks:read':     { label: 'Read your tasks',         description: 'View tasks assigned to or created by you' },
  'tasks:write':    { label: 'Manage your tasks',       description: 'Create, update, and complete tasks on your behalf' },
  'projects:read':  { label: 'View your projects',      description: 'Read your group project data and memberships' },
  'feed:read':      { label: 'Read your activity feed', description: 'Access your public posts and activity feed' },
}

interface ClientInfo {
  client_id: string
  client_name: string
  logo_url: string | null
  allowed_scopes: string[]
}

// ─── Inner component (needs useSearchParams) ──────────────────────────────────
function ConsentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const db = useMemo(() => createBrowserSupabaseClient(), [])

  const clientId     = searchParams.get('client_id') ?? ''
  const redirectUri  = searchParams.get('redirect_uri') ?? ''
  const scopeParam   = searchParams.get('scope') ?? ''
  const state        = searchParams.get('state') ?? ''
  const responseType = searchParams.get('response_type') ?? ''

  const [user, setUser]           = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [clientInfo, setClientInfo]   = useState<ClientInfo | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [processing, setProcessing]   = useState(false)
  const [paramError, setParamError]   = useState<string | null>(null)

  // Validate required query params
  useEffect(() => {
    if (!clientId) return setParamError('Missing client_id parameter.')
    if (!redirectUri) return setParamError('Missing redirect_uri parameter.')
    if (responseType !== 'code') return setParamError('Only response_type=code is supported.')
    if (!scopeParam) return setParamError('Missing scope parameter.')
  }, [clientId, redirectUri, responseType, scopeParam])

  // Watch Supabase auth state
  useEffect(() => {
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    return () => subscription?.unsubscribe()
  }, [db.auth])

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user && !paramError) {
      const returnTo = encodeURIComponent(`/oauth/consent?${searchParams.toString()}`)
      router.replace(`/login?redirect=${returnTo}`)
    }
  }, [authLoading, user, paramError, router, searchParams])

  // Fetch and validate the OAuth client
  useEffect(() => {
    if (paramError || !clientId || !redirectUri) return
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri })
    fetch(`/api/oauth/validate-client?${params}`)
      .then(res => res.json())
      .then((data) => {
        if (data.error) setClientError(data.error_description ?? data.error)
        else setClientInfo(data as ClientInfo)
      })
      .catch(() => setClientError('Failed to load application details. Please try again.'))
  }, [clientId, redirectUri, paramError])

  const requestedScopes = scopeParam.split(/[\s,]+/).filter(Boolean)

  const handleDecision = useCallback(async (approved: boolean) => {
    if (!user) return
    setProcessing(true)

    try {
      // Get current session to access token
      const { data: { session }, error: sessionError } = await db.auth.getSession()
      if (sessionError || !session?.access_token) {
        setClientError('Failed to get authentication token. Please try again.')
        setProcessing(false)
        return
      }

      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri, scope: scopeParam, state, approved }),
      })
      const data = await res.json()
      if (data.redirect) {
        window.location.href = data.redirect
      } else {
        setClientError(data.error ?? 'Authorization failed. Please try again.')
        setProcessing(false)
      }
    } catch {
      setClientError('Network error. Please check your connection.')
      setProcessing(false)
    }
  }, [user, clientId, redirectUri, scopeParam, state, db.auth])

  // ── Error states ────────────────────────────────────────────────────────────
  if (paramError || clientError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={40} color="var(--error)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text-main)', fontWeight: 800, marginBottom: '0.5rem' }}>Authorization Error</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: 1.6 }}>{paramError ?? clientError}</p>
        </div>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (authLoading || !clientInfo) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Consent screen ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '460px', width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          {clientInfo.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clientInfo.logo_url}
              alt={`${clientInfo.client_name} logo`}
              width={56}
              height={56}
              style={{ borderRadius: '14px', border: '1px solid var(--border)', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExternalLink size={24} color="var(--brand)" />
            </div>
          )}

          <div>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              <strong style={{ color: 'var(--brand)' }}>{clientInfo.client_name}</strong> wants to access your Espeezy account
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
              Signed in as <strong style={{ color: 'var(--text-sub)' }}>{user?.email}</strong>
            </p>
          </div>
        </div>

        {/* Scopes */}
        <div style={{ padding: '1.5rem 2rem' }}>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            This app will be able to:
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requestedScopes.map((scope) => {
              const meta = SCOPE_LABELS[scope]
              if (!meta) return null
              return (
                <li key={scope} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} color="var(--brand)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 700 }}>{meta.label}</div>
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.78rem', marginTop: '1px' }}>{meta.description}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Security note */}
        <div style={{ margin: '0 2rem', padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
          <ShieldCheck size={15} color="var(--brand)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem', margin: 0, lineHeight: 1.5 }}>
            Espeezy will not share your password. You can revoke this access anytime from your account settings.
          </p>
        </div>

        {/* Actions */}
        <div style={{ padding: '1.5rem 2rem 2rem', display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => handleDecision(false)}
            disabled={processing}
            style={{
              flex: 1,
              height: '3rem',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'transparent',
              color: 'var(--text-sub)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: processing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            <XCircle size={16} />
            Deny
          </button>
          <button
            onClick={() => handleDecision(true)}
            disabled={processing}
            style={{
              flex: 2,
              height: '3rem',
              border: 'none',
              borderRadius: '12px',
              background: processing ? 'rgba(16,185,129,0.5)' : 'var(--brand)',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: processing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'background 0.15s',
            }}
          >
            <ShieldCheck size={16} />
            {processing ? 'Authorizing…' : `Authorize ${clientInfo.client_name}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <ConsentContent />
    </Suspense>
  )
}
