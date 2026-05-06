import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const preregSchema = z.object({
	email: z.string().email().max(254),
	source: z.string().trim().max(50).optional(),
	fullName: z.string().trim().max(120).optional(),
	institution: z.string().trim().max(120).optional(),
	role: z.string().trim().max(50).optional(),
	referrer_code: z.string().trim().optional(),
})

function isValidReferralCode(code: unknown): code is string {
	if (typeof code !== 'string') return false
	return /^[A-Z0-9]{8}$/.test(code)
}
function generateReferralCode(): string {
	return randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}
function getSupabaseConfig() {
	const url = process.env.PROJECT_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.PUBLISHABLE_KEY
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
function sendWelcomeEmail(email: string, referralCode: string) {
	if (!process.env.RESEND_API_KEY) return
	const shareUrl = `https://espeezy.com/preregister?ref=${referralCode}`
	fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: 'Espeezy <hello@espeezy.com>',
			to: email,
			subject: "You're on the list 🚀 + share your link",
			html: `<div style="font-family:-apple-system,sans-serif;padding:20px;max-width:600px;"><h1>You're on the list! 🎉</h1><p>Share your link to get perks at launch:</p><code>${shareUrl}</code></div>`,
		}),
	}).catch(err => console.warn('[preregister] Resend failed:', err))
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

export async function GET() {
	try {
		const { ok, data } = await supaRest('pre_registrations?select=id', 'GET')
		if (ok && Array.isArray(data)) return NextResponse.json({ count: data.length })
	} catch { /* ignore */ }
	try {
		const { getAdminDb } = await import('@/lib/firebase-admin')
		const db = getAdminDb()
		if (db) {
			const snap = await db.collection('pre_registrations').get()
			return NextResponse.json({ count: snap.size })
		}
	} catch (err) {
		console.error('[preregister GET]', err)
	}
	return NextResponse.json({ count: 0 })
}

export async function POST(req: Request) {
	const body = await readRequestPayload(req)
	const parsed = preregSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json({
			error: 'Invalid request body.',
			details: parsed.error.issues.map(issue => ({
				path: issue.path.join('.'),
				message: issue.message,
			})),
		}, { status: 422 })
	}

	const cleanEmail = parsed.data.email.trim().toLowerCase()
	const cleanSource = (parsed.data.source ?? 'organic').slice(0, 50)
	const cleanReferrerCode = isValidReferralCode(parsed.data.referrer_code) ? parsed.data.referrer_code : null
	const cleanFullName = parsed.data.fullName ?? null
	const cleanInstitution = parsed.data.institution ?? null
	const cleanRole = parsed.data.role ?? null
	const ipRaw = (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown').split(',')[0].trim()
	const ipHash = createHash('sha256').update(ipRaw + (process.env.IP_HASH_SALT ?? 'fallback')).digest('hex').slice(0, 16)
	const ua = (req.headers.get('user-agent') ?? '').slice(0, 500)

	// Supabase path
	if (getSupabaseConfig()) {
		try {
			const { ok: lookOk, data: lookData } = await supaRest(
				`pre_registrations?email=eq.${encodeURIComponent(cleanEmail)}&select=referral_code,referral_count&limit=1`,
				'GET',
			)
			if (lookOk && Array.isArray(lookData) && lookData.length > 0) {
				const ex = lookData[0] as Record<string, unknown>
				return NextResponse.json({
					success: true,
					message: 'You are already registered! We will be in touch.',
					referral_code: ex.referral_code ?? null,
					referral_count: ex.referral_count ?? 0,
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
					return NextResponse.json({ success: true, message: 'You are already registered!', referral_code: null, referral_count: 0 })
				}
				console.error('[preregister] Supabase insert failed:', insStatus, insData)
				throw new Error('supabase_insert_failed')
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
			sendWelcomeEmail(cleanEmail, newCode)
			const { data: allData } = await supaRest('pre_registrations?select=id', 'GET')
			return NextResponse.json({
				success: true,
				message: 'You are on the list! We will notify you at launch.',
				referral_code: newCode,
				referral_count: 0,
				count: Array.isArray(allData) ? allData.length : 0,
			})
		} catch (supaErr) {
			console.warn('[preregister] Supabase failed, falling back to Firestore:', supaErr)
		}
	}

	// Firestore fallback
	try {
		const { getAdminDb } = await import('@/lib/firebase-admin')
		const db = getAdminDb()
		if (!db) {
			console.error('[preregister] No DB configured.')
			return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
		}
		const existingSnap = await db.collection('pre_registrations').where('email', '==', cleanEmail).limit(1).get()
		if (!existingSnap.empty) {
			const ex = existingSnap.docs[0].data()
			return NextResponse.json({
				success: true,
				message: 'You are already registered!',
				referral_code: ex.referral_code ?? null,
				referral_count: ex.referral_count ?? 0,
			})
		}
		const newCode = generateReferralCode()
		await db.collection('pre_registrations').add({
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
			created_at: new Date().toISOString(),
		})
		if (cleanReferrerCode) {
			const refSnap = await db
				.collection('pre_registrations')
				.where('referral_code', '==', cleanReferrerCode)
				.limit(1)
				.get()
			if (!refSnap.empty) {
				await refSnap.docs[0].ref.update({ referral_count: (refSnap.docs[0].data().referral_count ?? 0) + 1 })
			}
		}
		sendWelcomeEmail(cleanEmail, newCode)
		const allSnap = await db.collection('pre_registrations').get()
		return NextResponse.json({
			success: true,
			message: 'You are on the list!',
			referral_code: newCode,
			referral_count: 0,
			count: allSnap.size,
		})
	} catch (err) {
		console.error('[preregister] Firestore fallback error:', err)
		return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
	}
}