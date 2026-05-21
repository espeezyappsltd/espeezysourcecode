import { Resend } from 'resend'
import { sendEmail } from '@/services/email'

/**
 * Sends panel login OTP to the staff member's roster email (Resend or SMTP fallback).
 */
export async function deliverAdminLoginOtpEmail(params: {
  email: string
  username: string
  code: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? 'panel@espeezy.com'
  const subject = 'Espeezy Panel login code'
  const text = `Your Espeezy Panel login code for @${params.username} is ${params.code}. It expires in 10 minutes.`
  const html = `<p>Your Espeezy Panel login code for <strong>@${params.username}</strong> is:</p><p style="font-size:28px;font-weight:700;letter-spacing:0.2em">${params.code}</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>`

  if (apiKey) {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: `Espeezy Panel <${from}>`,
      to: [params.email],
      subject,
      html,
      text,
    })
    return !error
  }

  try {
    await sendEmail({ to: params.email, subject, html, text })
    return true
  } catch {
    return false
  }
}
