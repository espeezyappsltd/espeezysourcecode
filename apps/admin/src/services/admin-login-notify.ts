import { Resend } from 'resend'
import { sendEmail } from '@/services/email'

export type OtpDeliveryResult = {
  sms: boolean
  email: boolean
}

async function sendSmsOtp(phoneE164: string, code: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  if (!accountSid || !authToken || !from) return false

  const body = new URLSearchParams({
    To: phoneE164,
    From: from,
    Body: `Espeezy Panel login code: ${code}. Expires in 10 minutes. Do not share this code.`,
  })

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  return res.ok
}

async function sendResendOtpEmail(to: string, code: string, username: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? 'panel@espeezy.com'
  const subject = 'Espeezy Panel login code'
  const text = `Your Espeezy Panel login code for @${username} is ${code}. It expires in 10 minutes.`
  const html = `<p>Your Espeezy Panel login code for <strong>@${username}</strong> is:</p><p style="font-size:28px;font-weight:700;letter-spacing:0.2em">${code}</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>`

  if (apiKey) {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: `Espeezy Panel <${from}>`,
      to: [to],
      subject,
      html,
      text,
    })
    return !error
  }

  try {
    await sendEmail({ to, subject, html, text })
    return true
  } catch {
    return false
  }
}

/**
 * Delivers login OTP: SMS via Twilio when configured; always attempts email (Resend or SMTP fallback).
 */
export async function deliverAdminLoginOtp(params: {
  phoneE164: string
  email: string
  username: string
  code: string
}): Promise<OtpDeliveryResult> {
  const [sms, email] = await Promise.all([
    sendSmsOtp(params.phoneE164, params.code),
    sendResendOtpEmail(params.email, params.code, params.username),
  ])
  return { sms, email }
}
