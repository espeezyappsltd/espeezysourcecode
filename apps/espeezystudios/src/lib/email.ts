import nodemailer from 'nodemailer'
import { ESPEEZY_MAILBOX, STUDIO_EMAIL } from '@shared/platform-email-routes'

export type MailPayload = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: { filename: string; content: string }[]
}

/** Cloudflare Email Worker (workers/studio-email) — preferred when configured */
async function sendViaCloudflareWorker(payload: MailPayload): Promise<boolean> {
  const baseUrl = process.env.STUDIO_EMAIL_WORKER_URL?.replace(/\/$/, '')
  const secret = process.env.STUDIO_EMAIL_WORKER_SECRET
  if (!baseUrl || !secret) return false

  const res = await fetch(`${baseUrl}/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(err?.error ?? `Email worker failed (${res.status})`)
  }

  return true
}

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '465', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('Email service is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS).')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  })
}

export async function sendEmail(payload: MailPayload) {
  if (await sendViaCloudflareWorker(payload)) {
    return
  }

  const transport = createTransport()
  const smtpFrom = process.env.STUDIO_FROM_EMAIL || STUDIO_EMAIL.deliveryFrom
  const from = `"Espeezy Studios" <${smtpFrom}>`
  const replyTo = process.env.STUDIO_REPLY_TO || STUDIO_EMAIL.deliveryReplyTo

  return transport.sendMail({
    from,
    replyTo,
    to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    attachments: payload.attachments,
  })
}

export async function sendStudioDeliveryEmail(opts: {
  to: string
  clientName: string
  projectTitle: string
  invoiceNumber: string
  receiptNumber: string
  amountLabel: string
  reportExcerpt: string
  attachments: { filename: string; content: string }[]
}) {
  const subject = `Delivery package: ${opts.projectTitle} — Invoice ${opts.invoiceNumber}`

  await sendEmail({
    to: opts.to,
    subject,
    replyTo: process.env.STUDIO_REPLY_TO || STUDIO_EMAIL.deliveryReplyTo,
    attachments: opts.attachments,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);padding:24px;border-radius:12px 12px 0 0;color:#fff">
          <h1 style="margin:0;font-size:22px">Espeezy Studios — Project Delivered</h1>
          <p style="margin:8px 0 0;opacity:0.9;font-size:14px">${opts.invoiceNumber}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;color:#334155">
          <p>Hello ${opts.clientName},</p>
          <p>Your project <strong>${opts.projectTitle}</strong> delivery package is attached, including:</p>
          <ul>
            <li>requirements.txt</li>
            <li>PRD.md</li>
            <li>Final delivery report</li>
          </ul>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
            <tr><td style="padding:8px 0;color:#64748b">Invoice</td><td><strong>${opts.invoiceNumber}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Receipt</td><td><strong>${opts.receiptNumber}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Amount</td><td><strong>${opts.amountLabel}</strong></td></tr>
          </table>
          <pre style="background:#f8fafc;padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap">${opts.reportExcerpt.slice(0, 1200)}…</pre>
          <p style="font-size:12px;color:#64748b">Questions? Reply to this email or ${ESPEEZY_MAILBOX.support}</p>
        </div>
      </div>
    `,
    text: [
      `Project delivered: ${opts.projectTitle}`,
      `Invoice: ${opts.invoiceNumber}`,
      `Receipt: ${opts.receiptNumber}`,
      `Amount: ${opts.amountLabel}`,
      '',
      opts.reportExcerpt.slice(0, 2000),
    ].join('\n'),
  })
}
