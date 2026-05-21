import { Resend } from 'resend'
import { sendEmail } from '@/services/email'

export type AdminOtpEmailResult =
  | { ok: true; channel: 'resend' | 'smtp' }
  | { ok: false; error: string }

function formatFromAddress(from: string): string {
  const trimmed = from.trim()
  if (trimmed.includes('<') && trimmed.includes('>')) return trimmed
  return `Espeezy Panel <${trimmed}>`
}

/**
 * Sends panel login OTP to the staff member's roster email (Resend or SMTP fallback).
 */
export async function deliverAdminLoginOtpEmail(params: {
  email: string
  username: string
  code: string
}): Promise<AdminOtpEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? 'onboarding@resend.dev'
  const subject = 'Espeezy Panel login code'
  const text = `Your Espeezy Panel login code for @${params.username} is ${params.code}. It expires in 10 minutes.`
  const html = `<p>Your Espeezy Panel login code for <strong>@${params.username}</strong> is:</p><p style="font-size:28px;font-weight:700;letter-spacing:0.2em">${params.code}</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>`

  if (apiKey) {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: formatFromAddress(from),
      to: [params.email],
      subject,
      html,
      text,
    })
    if (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Resend rejected the email'
      console.error('[admin-otp] Resend error:', error)
      return { ok: false, error: `Resend: ${message}` }
    }
    if (!data?.id) {
      return { ok: false, error: 'Resend did not return a message id' }
    }
    return { ok: true, channel: 'resend' }
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
