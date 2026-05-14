import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'
import { generateServicePassword, isSupabaseUserExistsError } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'
const API_ORIGIN = (process.env.ESPEEZY_API_ORIGIN ?? 'https://espeezy.com').replace(/\/$/, '')

const preregSchema = z.object({
  email: z.string().email().max(254),
  source: z.string().trim().max(50).optional(),
  referrer_code: z.string().trim().max(8).nullish(),
  tier: z.enum(['free', 'pro', 'premium']).optional().default('free'),
})

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROJECT_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY ?? '').trim()
  if (!url || !key) return null
  return { url, key }
}

function isValidReferralCode(code: unknown): code is string {
  if (typeof code !== 'string') return false
  return /^[A-Z0-9]{8}$/.test(code)
}

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}

function getMainApi(req: Request): string | null {
  const currentOrigin = new URL(req.url).origin
  if (API_ORIGIN === currentOrigin) return null
  return `${API_ORIGIN}/api/preregister`
}

async function proxyToMainApi(req: Request, method: 'GET' | 'POST') {
  const mainApi = getMainApi(req)
  if (!mainApi) return null

  try {
    const body = method === 'POST' ? await req.text() : undefined
    const res = await fetch(mainApi, {
      method,
      headers: method === 'POST'
        ? {
            'Content-Type': req.headers.get('content-type') ?? 'application/json',
            'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
            'user-agent': req.headers.get('user-agent') ?? '',
          }
        : undefined,
      body,
      cache: method === 'GET' ? 'no-store' : undefined,
    })

    const data = await res.json().catch(() => ({ error: 'Unexpected upstream response.' }))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return null
  }
}

async function supaRest(
  path: string,
  method: string,
  body?: object,
): Promise<{ ok: boolean; data: unknown; status: number }> {
  const cfg = getSupabaseConfig()
  if (!cfg) return { ok: false, data: null, status: 0 }
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data: unknown = null
  const text = await res.text()
  try { data = JSON.parse(text) } catch { data = text }
  return { ok: res.ok, data, status: res.status }
}

async function ensureSupabaseAuthUser(email: string, source: string) {
  const cfg = getSupabaseConfig()
  if (!cfg) return false

  const randomPassword = generateServicePassword()
  const res = await fetch(`${cfg.url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: randomPassword,
      email_confirm: false,
      user_metadata: { source: source.slice(0, 50) },
    }),
  })

  if (res.ok) return true

  const payload = await res.json().catch(() => null)
  if (res.status === 422 && isSupabaseUserExistsError(payload)) {
    return true
  }

  console.error('[preregister] Supabase auth user create failed:', res.status, payload)
  return false
}

async function getRegistrationCount() {
  const cfg = getSupabaseConfig()
  if (!cfg) return null

  const res = await fetch(`${cfg.url}/rest/v1/pre_registrations?select=*&limit=0`, {
    method: 'GET',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      Prefer: 'count=exact',
    },
  })

  if (!res.ok) return null

  const range = res.headers.get('content-range')
  if (!range) return 0

  const total = Number(range.split('/')[1] ?? '0')
  return Number.isFinite(total) ? total : 0
}

async function findExistingRegistrationByEmail(email: string) {
  const { ok, data } = await supaRest(
    `pre_registrations?email=eq.${encodeURIComponent(email)}&select=id,referral_code,referral_count&limit=1`,
    'GET',
  )
  if (!ok || !Array.isArray(data) || data.length === 0) return null
  return data[0] as Record<string, unknown>
}

export async function GET(req: Request) {
  if (!getSupabaseConfig()) {
    const proxied = await proxyToMainApi(req, 'GET')
    if (proxied) return proxied
    return NextResponse.json({ count: 0 })
  }

  try {
    const count = await getRegistrationCount()
    return NextResponse.json({ count: count ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

export async function POST(req: Request) {
  const supabaseConfig = getSupabaseConfig()
  if (!supabaseConfig) {
    const proxied = await proxyToMainApi(req, 'POST')
    if (proxied) return proxied
    return NextResponse.json({ error: 'Registration service temporarily unavailable.' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const parsed = preregSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid request body.',
    }, { status: 422 })
  }

  const cleanEmail = parsed.data.email.trim().toLowerCase()
  const cleanSource = (parsed.data.source ?? 'organic').slice(0, 50)
  const cleanReferrerCode = isValidReferralCode(parsed.data.referrer_code) ? parsed.data.referrer_code : null
  const cleanTier = parsed.data.tier ?? 'free'
  const ipRaw = (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown').split(',')[0].trim()
  const ipHash = createHash('sha256').update(ipRaw + (process.env.IP_HASH_SALT ?? 'fallback')).digest('hex').slice(0, 16)
  const ua = (req.headers.get('user-agent') ?? '').slice(0, 500)
  try {
    const existing = await findExistingRegistrationByEmail(cleanEmail)
    if (existing) {
      const ensured = await ensureSupabaseAuthUser(cleanEmail, `${cleanSource}-existing`)
      if (!ensured) {
        return NextResponse.json({ error: 'Unable to register right now.' }, { status: 503 })
      }
      return NextResponse.json({
        success: true,
        message: 'You are already registered! We will be in touch.',
        referral_code: existing.referral_code ?? null,
        referral_count: existing.referral_count ?? 0,
      })
    }

    const newCode = generateReferralCode()
    const { ok: insOk, data: insData, status: insStatus } = await supaRest('pre_registrations', 'POST', {
      email: cleanEmail,
      source: cleanSource,
      ip_hash: ipHash,
      user_agent: ua,
      referral_code: newCode,
      referrer_code: cleanReferrerCode,
      referral_count: 0,
      tier: cleanTier,
    })

    if (!insOk) {
      if (insStatus === 409 || JSON.stringify(insData).includes('23505')) {
        const duplicate = await findExistingRegistrationByEmail(cleanEmail)
        const ensured = await ensureSupabaseAuthUser(cleanEmail, `${cleanSource}-duplicate`)
        if (!ensured) {
          return NextResponse.json({ error: 'Unable to register right now.' }, { status: 503 })
        }
        return NextResponse.json({
          success: true,
          message: 'You are already registered!',
          referral_code: duplicate?.referral_code ?? null,
          referral_count: duplicate?.referral_count ?? 0,
        })
      }
      // Retry with minimal payload if columns are missing
      if (insStatus === 400) {
        const errStr = JSON.stringify(insData)
        const isColumnError = errStr.includes('42703') || errStr.includes('does not exist')
        if (isColumnError) {
          const { ok: retryOk, data: retryData } = await supaRest('pre_registrations', 'POST', {
            email: cleanEmail,
            source: cleanSource,
            referral_code: newCode,
            referrer_code: cleanReferrerCode,
            referral_count: 0,
            tier: cleanTier,
          })
          if (!retryOk) {
            console.error('[preregister] Supabase minimal insert failed:', retryData)
            return NextResponse.json({ error: 'Unable to register right now.' }, { status: 503 })
          }
          const ensured = await ensureSupabaseAuthUser(cleanEmail, `${cleanSource}-minimal`)
          if (!ensured) {
            return NextResponse.json({ error: 'Unable to register right now.' }, { status: 503 })
          }
          const count2 = await getRegistrationCount()
          return NextResponse.json({
            success: true,
            message: 'You are on the list! We will notify you at launch.',
            referral_code: newCode,
            referral_count: 0,
            count: count2 ?? 0,
          })
        }
      }
      console.error('[preregister] Supabase insert failed:', insStatus, insData)
      return NextResponse.json({ error: 'Unable to register right now.' }, { status: 503 })
    }

    // Update referrer count if provided
    if (cleanReferrerCode) {
      const { data: refData } = await supaRest(
        `pre_registrations?referral_code=eq.${cleanReferrerCode}&select=id,referral_count&limit=1`,
        'GET',
      )
      if (Array.isArray(refData) && refData.length > 0) {
        const ref = refData[0] as Record<string, unknown>
        await supaRest(`pre_registrations?id=eq.${ref.id}`, 'PATCH', {
          referral_count: ((ref.referral_count as number) ?? 0) + 1,
        }).catch(() => {})
      }
    }

    const ensured = await ensureSupabaseAuthUser(cleanEmail, cleanSource)
    if (!ensured) {
      return NextResponse.json({ error: 'Unable to register right now.' }, { status: 503 })
    }

    const count = await getRegistrationCount()
    return NextResponse.json({
      success: true,
      message: 'You are on the list! We will notify you at launch.',
      referral_code: newCode,
      referral_count: 0,
      count: count ?? 0,
    })
  } catch (err) {
    console.error('[preregister] Supabase error:', err)
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
  }
}
