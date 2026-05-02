/**
 * Email service — Namecheap Pro Email via SMTP
 *
 * Required env vars (set in Vercel + .env.local):
 *   SMTP_HOST       = mail.privateemail.com
 *   SMTP_PORT       = 465
 *   SMTP_USER       = feedback@espeezy.com   (or whichever sending mailbox)
 *   SMTP_PASS       = <mailbox password>
 *   FEEDBACK_EMAIL  = feedback@espeezy.com
 *   SUPPORT_EMAIL   = support@espeezy.com
 */

import nodemailer, { SentMessageInfo } from 'nodemailer'

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '465', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP credentials not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  })
}

export interface MailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Send an email. Returns the nodemailer MessageInfo on success.
 * Throws on transport/auth failure so callers can decide whether to 503.
 */
export async function sendEmail(payload: MailPayload): Promise<SentMessageInfo> {
  const transport = createTransport()
  const from = `"Espeezy" <${process.env.SMTP_USER}>`

  return transport.sendMail({
    from,
    to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo,
  })
}

// ─── Notification helpers ───────────────────────────────────────────────────

/** Notify feedback@espeezy.com when a user submits a support ticket */
export async function notifySupportTicket(opts: {
  ticketId: string
  userId: string
  userEmail: string
  summary: string
}): Promise<void> {
  const to = process.env.FEEDBACK_EMAIL ?? 'feedback@espeezy.com'
  await sendEmail({
    to,
    subject: `[Support] New ticket from ${opts.userEmail}`,
    replyTo: opts.userEmail,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color:#10b981">New Support Ticket</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#666">Ticket ID</td><td><strong>${opts.ticketId}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">User ID</td><td><code>${opts.userId}</code></td></tr>
          <tr><td style="padding:8px 0;color:#666">User email</td><td>${opts.userEmail}</td></tr>
        </table>
        <h3 style="margin-top:24px">Summary</h3>
        <p style="background:#f4f4f4;padding:16px;border-radius:8px;white-space:pre-wrap">${escapeHtml(opts.summary)}</p>
        <hr style="margin-top:32px;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#999">Espeezy · espeezy.com</p>
      </div>
    `,
    text: `New support ticket\nID: ${opts.ticketId}\nUser: ${opts.userEmail}\n\n${opts.summary}`,
  })
}

/** Welcome email for new user registration */
export async function sendWelcomeEmail(opts: {
  to: string
  displayName: string
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: 'Welcome to Espeezy!',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:40px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px;letter-spacing:-0.03em">Welcome to Espeezy</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #eee;border-top:none;border-radius:0 0 16px 16px">
          <p style="font-size:18px;color:#111">Hi <strong>${escapeHtml(opts.displayName)}</strong>,</p>
          <p style="color:#444;line-height:1.6">You're in. Espeezy is a platform where students collaborate on real projects, earn from their contributions, and build proof-of-work credentials that matter.</p>
          <a href="https://espeezy.com/dashboard" style="display:inline-block;margin-top:24px;background:#10b981;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700">Go to Dashboard →</a>
          <p style="margin-top:32px;font-size:13px;color:#888">Questions? Reply to this email or visit <a href="https://espeezy.com" style="color:#10b981">espeezy.com</a></p>
        </div>
      </div>
    `,
    text: `Hi ${opts.displayName},\n\nWelcome to Espeezy!\n\nGo to dashboard: https://espeezy.com/dashboard`,
  })
}

/** Notification when a student certificate is generated */
export async function sendCertificateEmail(opts: {
  to: string
  displayName: string
  certificateId: string
  programName: string
  verifyUrl: string
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `Your Espeezy Certificate of Completion — ${opts.programName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:40px;border-radius:16px 16px 0 0;text-align:center">
          <div style="font-size:48px">🎓</div>
          <h1 style="color:white;margin:8px 0 0;font-size:24px">Certificate of Completion</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #eee;border-top:none;border-radius:0 0 16px 16px">
          <p style="font-size:18px;color:#111">Congratulations, <strong>${escapeHtml(opts.displayName)}</strong>!</p>
          <p style="color:#444;line-height:1.6">You have successfully completed <strong>${escapeHtml(opts.programName)}</strong> on the Espeezy platform. This certificate is digitally verifiable and can be shared with employers and institutions.</p>
          <div style="background:#f0fdf4;border:1px solid #10b981;border-radius:10px;padding:16px;margin:24px 0">
            <p style="margin:0;font-size:12px;color:#065f46;font-weight:700;text-transform:uppercase;letter-spacing:1px">Certificate ID</p>
            <code style="font-size:14px;color:#064e3b">${opts.certificateId}</code>
          </div>
          <a href="${opts.verifyUrl}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700">Download Certificate →</a>
          <p style="margin-top:24px;font-size:13px;color:#888">Verify authenticity at <a href="${opts.verifyUrl}" style="color:#10b981">${opts.verifyUrl}</a></p>
        </div>
      </div>
    `,
    text: `Congratulations ${opts.displayName}!\n\nYour certificate for ${opts.programName} is ready.\nCertificate ID: ${opts.certificateId}\nVerify at: ${opts.verifyUrl}`,
  })
}

/** Transaction receipt for P2P payments */
export async function sendP2PTransactionEmail(opts: {
  to: string[]
  role: 'sender' | 'recipient'
  transferId: string
  counterpartyName: string
  counterpartyUsername: string
  amountCents: number
  feeCents: number
  netCents: number
  note?: string | null
}): Promise<void> {
  const amount = `$${(opts.amountCents / 100).toFixed(2)}`
  const fee = `$${(opts.feeCents / 100).toFixed(2)}`
  const net = `$${(opts.netCents / 100).toFixed(2)}`
  const subject = opts.role === 'sender'
    ? `Payment sent to @${opts.counterpartyUsername} (${amount})`
    : `Payment received from @${opts.counterpartyUsername} (${net})`

  await sendEmail({
    to: opts.to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="margin:0 0 12px;color:#0f172a">Espeezy Transaction Receipt</h2>
        <p style="margin:0 0 18px;color:#334155">
          ${opts.role === 'sender'
            ? `You successfully sent <strong>${amount}</strong> to <strong>${escapeHtml(opts.counterpartyName)}</strong> (@${escapeHtml(opts.counterpartyUsername)}).`
            : `You received <strong>${net}</strong> from <strong>${escapeHtml(opts.counterpartyName)}</strong> (@${escapeHtml(opts.counterpartyUsername)}).`}
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#64748b">Transfer ID</td><td><code>${escapeHtml(opts.transferId)}</code></td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Amount</td><td>${amount}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Platform fee</td><td>${fee}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Net received</td><td>${net}</td></tr>
          ${opts.note ? `<tr><td style="padding:8px 0;color:#64748b">Note</td><td>${escapeHtml(opts.note)}</td></tr>` : ''}
        </table>
        <p style="margin:18px 0 0;color:#64748b;font-size:12px">This receipt was generated by Espeezy at espeezy.com.</p>
      </div>
    `,
    text: [
      'Espeezy Transaction Receipt',
      `Transfer ID: ${opts.transferId}`,
      `Amount: ${amount}`,
      `Platform fee: ${fee}`,
      `Net received: ${net}`,
      opts.note ? `Note: ${opts.note}` : '',
    ].filter(Boolean).join('\n'),
  })
}

// ─── Util ───────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
