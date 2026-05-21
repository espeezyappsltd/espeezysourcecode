import { Resend } from 'resend'
import { sendEmail } from '@/services/email'

export type AdminOtpEmailResult =
  | { ok: true; channel: 'resend' | 'smtp'; messageId?: string }
  | { ok: false; error: string }

const RESEND_TEST_FROM = 'onboarding@resend.dev'

function formatFromAddress(from: string): string {
  const trimmed = from.trim()
  if (trimmed.includes('<') && trimmed.includes('>')) return trimmed
  return `Espeezy Panel <${trimmed}>`
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production'
}

function resendErrorMessage(error: { message?: string; name?: string }): string {
  const parts = [error.message, error.name].filter(Boolean)
  return parts.length > 0 ? parts.join(' — ') : 'Resend rejected the email'
}

/**
 * Resend `from` must use a verified domain in production (not onboarding@resend.dev).
 * @see https://resend.com/domains
 */
export function resolveResendFromAddress():
  | { ok: true; from: string }
  | { ok: false; error: string } {
  const configured = process.env.RESEND_FROM_EMAIL?.trim()
  const production = isProductionEnv()

  if (production) {
    if (!configured) {
      return {
        ok: false,
        error: 'RESEND_FROM_EMAIL is required in production. Verify a domain at https://resend.com/domains',
      }
    }
    if (configured.includes(RESEND_TEST_FROM)) {
      return {
        ok: false,
        error:
          'RESEND_FROM_EMAIL must use your verified domain in production (not onboarding@resend.dev).',
      }
    }
    return { ok: true, from: formatFromAddress(configured) }
  }

  const from = configured ?? RESEND_TEST_FROM
  return { ok: true, from: formatFromAddress(from) }
}

/**
 * Sends panel login OTP via Resend (preferred) or SMTP fallback.
 * Resend: uses RESEND_API_KEY, { data, error } handling, and idempotencyKey when otpId is set.
 */
export async function deliverAdminLoginOtpEmail(params: {
  email: string
  username: string
  code: string
  otpId?: string
}): Promise<AdminOtpEmailResult> {
  const subject = 'Espeezy Panel login code'
  const text = `Your Espeezy Panel login code for @${params.username} is ${params.code}. It expires in 10 minutes.`
  const html = `<p>Your Espeezy Panel login code for <strong>@${params.username}</strong> is:</p><p style="font-size:28px;font-weight:700;letter-spacing:0.2em">${params.code}</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>`

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (apiKey) {
    const fromResult = resolveResendFromAddress()
    if (!fromResult.ok) {
      return { ok: false, error: fromResult.error }
    }

    const resend = new Resend(apiKey)
    const idempotencyKey = params.otpId ? `admin-otp/${params.otpId}` : undefined

    const { data, error } = await resend.emails.send({
      from: fromResult.from,
      to: [params.email],
      subject,
      html,
      text,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      tags: [
        { name: 'category', value: 'admin_otp' },
        { name: 'username', value: params.username.slice(0, 256) },
      ],
    })

    if (error) {
      console.error('[admin-otp] Resend error:', error)
      return { ok: false, error: `Resend: ${resendErrorMessage(error)}` }
    }

    if (!data?.id) {
      return { ok: false, error: 'Resend did not return a message id' }
    }

    return { ok: true, channel: 'resend', messageId: data.id }
  }

  if (isProductionEnv()) {
    return {
      ok: false,
      error: 'RESEND_API_KEY is required in production. Create a key at https://resend.com/api-keys',
    }
  }

  try {
    await sendEmail({ to: params.email, subject, html, text })
    return { ok: true, channel: 'smtp' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'SMTP send failed'
    return { ok: false, error: message }
  }
}

export function isPanelOtpDevMode(): boolean {
  return process.env.NODE_ENV !== 'production'
}
