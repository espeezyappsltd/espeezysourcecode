import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'
import { sendPreregistrationConfirmationEmail } from '@/services/email'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

const allowedOrigins = new Set([
	'https://espeezy.com',
	'https://www.espeezy.com',
	'https://games.espeezy.com',
	'https://kanban.espeezy.com',
	'http://localhost:3000',
	'http://localhost:3001',
	'http://localhost:3002',
	'http://localhost:3003',
])

function getCorsHeaders(req: Request): Record<string, string> {
	const origin = req.headers.get('origin') ?? ''
	const allowOrigin = allowedOrigins.has(origin) ? origin : 'https://espeezy.com'
	return {
		'Access-Control-Allow-Origin': allowOrigin,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
		'Access-Control-Max-Age': '86400',
		Vary: 'Origin',
	}
}

function jsonWithCors(req: Request, body: unknown, init?: ResponseInit) {
	return NextResponse.json(body, {
		...init,
		headers: {
			...(init?.headers ?? {}),
			...getCorsHeaders(req),
		},
	})
}

const preregSchema = z.object({
	email: z.string().email().max(254),
	password: z.string().min(8).max(72).optional(),
	source: z.string().trim().max(50).optional(),
	fullName: z.string().trim().max(120).optional(),
	institution: z.string().trim().max(120).optional(),
	role: z.string().trim().max(50).optional(),
	referrer_code: z.string().trim().max(8).nullish(),
})

function isValidReferralCode(code: unknown): code is string {
	if (typeof code !== 'string') return false
	return /^[A-Z0-9]{8}$/.test(code)
}
function generateReferralCode(): string {
	return randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}
function getSupabaseConfig() {
	const url = process.env.PROJECT_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
	const key = process.env.SECRET_KEY?.trim() ?? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
	if (!url || !key) return null
	return { url, key }
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

type ProvisionResult = {
	supabaseReady: boolean
	firebaseReady: boolean
	errorMessage: string | null
}

async function authAdminRequest(
	path: string,
	method: string,
	body?: object,
): Promise<{ ok: boolean; data: unknown; status: number }> {
	const cfg = getSupabaseConfig()
	if (!cfg) return { ok: false, data: null, status: 0 }

	const res = await fetch(`${cfg.url}/auth/v1/admin/${path}`, {
		method,
		headers: {
			apikey: cfg.key,
			Authorization: `Bearer ${cfg.key}`,
			'Content-Type': 'application/json',
		},
		body: body ? JSON.stringify(body) : undefined,
	})

	let data: unknown = null
	const text = await res.text()
	try { data = JSON.parse(text) } catch { data = text }
	return { ok: res.ok, data, status: res.status }
}

function looksLikeExistingAuthUserError(data: unknown) {
	const text = JSON.stringify(data).toLowerCase()
	return text.includes('already') || text.includes('exists') || text.includes('registered') || text.includes('duplicate')
}

async function provisionSupabaseAccount(opts: {
	email: string
	password: string
	fullName: string | null
	source: string
	role: string | null
	institution: string | null
}): Promise<{ ok: boolean; created: boolean; message?: string }> {
	const { ok, data, status } = await authAdminRequest('users', 'POST', {
		email: opts.email,
		password: opts.password,
		email_confirm: true,
		user_metadata: {
			full_name: opts.fullName,
			source: opts.source,
			role: opts.role,
			institution: opts.institution,
		},
		app_metadata: {
			provider: 'email',
			providers: ['email'],
		},
	})

	if (ok) return { ok: true, created: true }
	if (status === 422 || status === 400 || status === 409) {
		if (looksLikeExistingAuthUserError(data)) return { ok: true, created: false }
	}

	return { ok: false, created: false, message: typeof data === 'string' ? data : 'Unable to create Supabase login.' }
}

async function provisionFirebaseAccount(opts: {
	email: string
	password: string
	fullName: string | null
	role: string | null
	institution: string | null
}): Promise<{ ok: boolean; created: boolean; message?: string }> {
	const adminAuth = getAdminAuth()
	if (!adminAuth) {
		return { ok: false, created: false, message: 'Firebase auth is not configured.' }
	}

	let uid: string | null = null
	let created = false

	try {
		const userRecord = await adminAuth.createUser({
			email: opts.email,
			password: opts.password,
			emailVerified: true,
			displayName: opts.fullName ?? undefined,
		})
		uid = userRecord.uid
		created = true
	} catch (error) {
		const err = error as { code?: string; message?: string }
		if (err.code !== 'auth/email-already-exists') {
			return { ok: false, created: false, message: err.message ?? 'Unable to create Firebase login.' }
		}

		try {
			const existing = await adminAuth.getUserByEmail(opts.email)
			uid = existing.uid
		} catch (lookupError) {
			const errLookup = lookupError as { message?: string }
			return { ok: false, created: false, message: errLookup.message ?? 'Unable to load Firebase login.' }
		}
	}

	if (!uid) return { ok: false, created, message: 'Firebase user id was not available.' }

	const adminDb = getAdminDb()
	if (!adminDb) return { ok: true, created }

	const profileRef = adminDb.collection('profiles').doc(uid)
	const existingProfile = await profileRef.get()
	if (!existingProfile.exists) {
		await profileRef.set({
			id: uid,
			email: opts.email,
			full_name: opts.fullName,
			institution: opts.institution,
			role: opts.role,
			legal_accepted: true,
			total_score: 0,
			created_at: new Date().toISOString(),
		})
	}

	return { ok: true, created }
}

async function provisionUnifiedLogin(opts: {
	email: string
	password: string
	fullName: string | null
	role: string | null
	institution: string | null
	source: string
}): Promise<ProvisionResult> {
	const [supabaseResult, firebaseResult] = await Promise.all([
		provisionSupabaseAccount(opts),
		provisionFirebaseAccount(opts),
	])

	if (!supabaseResult.ok || !firebaseResult.ok) {
		return {
			supabaseReady: supabaseResult.ok,
			firebaseReady: firebaseResult.ok,
			errorMessage: supabaseResult.message ?? firebaseResult.message ?? 'Unable to prepare your login on every Espeezy app.',
		}
	}

	return {
		supabaseReady: true,
		firebaseReady: true,
		errorMessage: null,
	}
}

async function findExistingRegistrationByEmail(email: string) {
	const { ok, data } = await supaRest(
		`pre_registrations?email=eq.${encodeURIComponent(email)}&select=id,referral_code,referral_count&limit=1`,
		'GET',
	)
	if (!ok || !Array.isArray(data) || data.length === 0) return null
	return data[0] as Record<string, unknown>
}

async function readRequestPayload(req: Request): Promise<Record<string, unknown> | null> {
	const contentType = (req.headers.get('content-type') ?? '').toLowerCase()

	if (contentType.includes('application/json')) {
		const json = await req.json().catch(() => null)
		if (json && typeof json === 'object') return json as Record<string, unknown>
		return null
	}

	if (contentType.includes('application/x-www-form-urlencoded')) {
		const text = await req.text().catch(() => '')
		if (!text) return null
		const form = new URLSearchParams(text)
		const out: Record<string, unknown> = {}
		for (const [k, v] of form.entries()) out[k] = v
		return out
	}

	if (contentType.includes('multipart/form-data')) {
		const form = await req.formData().catch(() => null)
		if (!form) return null
		const out: Record<string, unknown> = {}
		for (const [k, v] of form.entries()) out[k] = typeof v === 'string' ? v : v.name
		return out
	}

	const raw = await req.text().catch(() => '')
	if (!raw) return null
	try {
		const parsed = JSON.parse(raw)
		if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
	} catch {
		const form = new URLSearchParams(raw)
		const out: Record<string, unknown> = {}
		for (const [k, v] of form.entries()) out[k] = v
		if (Object.keys(out).length > 0) return out
	}

	return null
}

export async function OPTIONS(req: Request) {
	return new NextResponse(null, {
		status: 204,
		headers: getCorsHeaders(req),
	})
}

export async function GET(req: Request) {
	if (!getSupabaseConfig()) {
		return jsonWithCors(req, { error: 'Supabase is not configured.', count: 0 }, { status: 503 })
	}

	try {
		const count = await getRegistrationCount()
		return jsonWithCors(req, { count: count ?? 0 })
	} catch (err) {
		console.error('[preregister GET]', err)
		return jsonWithCors(req, { count: 0 })
	}
}

export async function POST(req: Request) {
	const body = await readRequestPayload(req)
	const parsed = preregSchema.safeParse(body)
	if (!parsed.success) {
		return jsonWithCors(req, {
			error: 'Invalid request body.',
			details: parsed.error.issues.map(issue => ({
				path: issue.path.join('.'),
				message: issue.message,
			})),
		}, { status: 422 })
	}

	const cleanEmail = parsed.data.email.trim().toLowerCase()
	const cleanPassword = parsed.data.password
	const cleanSource = (parsed.data.source ?? 'organic').slice(0, 50)
	const cleanReferrerCode = isValidReferralCode(parsed.data.referrer_code) ? parsed.data.referrer_code : null
	const cleanFullName = parsed.data.fullName ?? null
	const cleanInstitution = parsed.data.institution ?? null
	const cleanRole = parsed.data.role ?? null
	const ipRaw = (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown').split(',')[0].trim()
	const ipHash = createHash('sha256').update(ipRaw + (process.env.IP_HASH_SALT ?? 'fallback')).digest('hex').slice(0, 16)
	const ua = (req.headers.get('user-agent') ?? '').slice(0, 500)
	const supabaseConfig = getSupabaseConfig()

	if (!supabaseConfig) {
		return jsonWithCors(req, { error: 'Supabase is not configured.' }, { status: 503 })
	}

	try {
		let authProvisionResult: ProvisionResult | null = null
		if (cleanPassword) {
			authProvisionResult = await provisionUnifiedLogin({
				email: cleanEmail,
				password: cleanPassword,
				fullName: cleanFullName,
				institution: cleanInstitution,
				role: cleanRole,
				source: cleanSource,
			})
		}

		const existing = await findExistingRegistrationByEmail(cleanEmail)
		if (existing) {
			if (authProvisionResult && authProvisionResult.errorMessage) {
				return jsonWithCors(req, {
					error: authProvisionResult.errorMessage,
					registration_saved: true,
					supabase_ready: authProvisionResult.supabaseReady,
					firebase_ready: authProvisionResult.firebaseReady,
				}, { status: 503 })
			}

			return jsonWithCors(req, {
				success: true,
				message: cleanPassword
					? 'You are already registered and your Espeezy login is ready.'
					: 'You are already registered! We will be in touch.',
				referral_code: existing.referral_code ?? null,
				referral_count: existing.referral_count ?? 0,
				login_ready: Boolean(cleanPassword),
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
				return jsonWithCors(req, {
					success: true,
					message: 'You are already registered!',
					referral_code: duplicate?.referral_code ?? null,
					referral_count: duplicate?.referral_count ?? 0,
				})
			}
			// Retry with minimal payload if columns are missing (table schema may not have optional fields)
			if (insStatus === 400) {
				const errStr = JSON.stringify(insData)
				const isColumnError = errStr.includes('42703') || errStr.includes('does not exist')
				if (isColumnError) {
					const { ok: retryOk, data: retryData, status: retryStatus } = await supaRest('pre_registrations', 'POST', {
						email: cleanEmail,
						source: cleanSource,
						referral_code: newCode,
						referrer_code: cleanReferrerCode,
						referral_count: 0,
					})
					if (!retryOk) {
						console.error('[preregister] Supabase minimal insert failed:', retryStatus, retryData)
						return jsonWithCors(req, { error: 'Unable to register right now.' }, { status: 503 })
					}
					// Minimal insert succeeded — fall through
					const count2 = await getRegistrationCount()
					return jsonWithCors(req, {
						success: true,
						message: 'You are on the list! We will notify you at launch.',
						referral_code: newCode,
						referral_count: 0,
						count: count2 ?? 0,
					})
				}
			}
			console.error('[preregister] Supabase insert failed:', insStatus, insData)
			return jsonWithCors(req, { error: 'Unable to register right now.' }, { status: 503 })
		}

		if (authProvisionResult && authProvisionResult.errorMessage) {
			return jsonWithCors(req, {
				error: authProvisionResult.errorMessage,
				registration_saved: true,
				supabase_ready: authProvisionResult.supabaseReady,
				firebase_ready: authProvisionResult.firebaseReady,
			}, { status: 503 })
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
		}).catch(err => {
			console.error('[preregister] Confirmation email failed:', err)
		})

		const count = await getRegistrationCount()
		return jsonWithCors(req, {
			success: true,
			message: cleanPassword
				? 'You are on the list and your login now works across Espeezy, Games, and Kanban.'
				: 'You are on the list! We will notify you at launch.',
			referral_code: newCode,
			referral_count: 0,
			count: count ?? 0,
			login_ready: Boolean(cleanPassword),
		})
	} catch (err) {
		console.error('[preregister] Supabase error:', err)
		return jsonWithCors(req, { error: 'Service temporarily unavailable.' }, { status: 503 })
	}
}
