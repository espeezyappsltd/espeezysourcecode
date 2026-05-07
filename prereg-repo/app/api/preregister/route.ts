import { createHash, randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPreregistrationConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const preregSchema = z.object({
  email: z.string().email().max(254),
  source: z.string().trim().max(50).optional(),
  fullName: z.string().trim().max(120).optional(),
  institution: z.string().trim().max(120).optional(),
  role: z.string().trim().max(50).optional(),
  referrer_code: z.string().trim().max(8).optional(),
})

function isValidReferralCode(code: unknown): code is string {
  return typeof code === 'string' && /^[A-Z0-9]{8}$/.test(code)
}

function generateReferralCode() {
  return randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}

function getSupabaseConfig() {
  const url = process.env.PROJECT_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SECRET_KEY?.trim() ?? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return { url, key }
}

async function supaRest(path: string, method: string, body?: object) {
  const cfg = getSupabaseConfig()
  if (!cfg) return { ok: false, data: null as unknown, status: 0 }

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

  const text = await res.text()
  let data: unknown = null
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  return { ok: res.ok, data, status: res.status }
}

async function getRegistrationCount() {
  const cfg = getSupabaseConfig()
  if (!cfg) return null

  const res = await fetch(`${cfg.url}/rest/v1/pre_registrations?select=id`, {
    method: 'HEAD',
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

export async function GET() {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.', count: 0 }, { status: 503 })
  }

  try {
    const count = await getRegistrationCount()
    if (typeof count === 'number') return NextResponse.json({ count })
  } catch (err) {
    console.error('[preregister GET]', err)
  }

  return NextResponse.json({ error: 'Unable to read pre-registrations right now.', count: 0 }, { status: 503 })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = preregSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request body.',
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 422 },
    )
  }

  const cleanEmail = parsed.data.email.trim().toLowerCase()
  const cleanSource = (parsed.data.source ?? 'organic').slice(0, 50)
  const cleanReferrerCode = isValidReferralCode(parsed.data.referrer_code)
    ? parsed.data.referrer_code
    : null
  const cleanFullName = parsed.data.fullName ?? null
  const cleanInstitution = parsed.data.institution ?? null
  const cleanRole = parsed.data.role ?? null
  const ipRaw =
    (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown')
      .split(',')[0]
      .trim()
  const ipHash = createHash('sha256')
    .update(ipRaw + (process.env.IP_HASH_SALT ?? 'fallback'))
    .digest('hex')
    .slice(0, 16)
  const ua = (req.headers.get('user-agent') ?? '').slice(0, 500)

  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  try {
    const existing = await findExistingRegistrationByEmail(cleanEmail)
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'You are already registered.',
        referral_code: existing.referral_code ?? null,
        referral_count: existing.referral_count ?? 0,
      })
    }

    const newCode = generateReferralCode()
    const { ok: insOk, data: insData, status: insStatus } = await supaRest('pre_registrations', 'POST', {
      email: cleanEmail,
      source: cleanSource,
      full_name: cleanFullName,
      institution: cleanInstitution,
      role: cleanRole,
      ip_hash: ipHash,
      user_agent: ua,
      referral_code: newCode,
      referrer_code: cleanReferrerCode,
      referral_count: 0,
    })

    if (!insOk) {
      if (insStatus === 409 || JSON.stringify(insData).includes('23505')) {
        const duplicate = await findExistingRegistrationByEmail(cleanEmail)
        return NextResponse.json({
          success: true,
          message: 'You are already registered.',
          referral_code: duplicate?.referral_code ?? null,
          referral_count: duplicate?.referral_count ?? 0,
        })
      }
      return NextResponse.json({ error: 'Unable to register right now.' }, { status: 503 })
    }

    if (cleanReferrerCode) {
      const { data: refData } = await supaRest(
        `pre_registrations?referral_code=eq.${cleanReferrerCode}&select=id,referral_count&limit=1`,
        'GET',
      )
      if (Array.isArray(refData) && refData.length > 0) {
        const ref = refData[0] as Record<string, unknown>
        await supaRest(`pre_registrations?id=eq.${ref.id}`, 'PATCH', {
          referral_count: ((ref.referral_count as number) ?? 0) + 1,
        })
      }
    }

    void sendPreregistrationConfirmationEmail({
      to: cleanEmail,
      referralCode: newCode,
    }).catch((err) => {
      console.error('[preregister email]', err)
    })

    const count = await getRegistrationCount()
    return NextResponse.json({
      success: true,
      message: 'You are on the list.',
      referral_code: newCode,
      referral_count: 0,
      count: count ?? 0,
    })
  } catch (err) {
    console.error('[preregister]', err)
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
  }
}
