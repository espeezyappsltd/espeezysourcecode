import { createHash, randomBytes } from 'crypto'
import { jsPDF } from 'jspdf'
import { formatCredits } from '@/lib/credits'
import { resolveProfileDisplayName } from '@/lib/marketplace/profile-display-name'
import type { ProfileNameFields } from '@/lib/marketplace/profile-display-name'

export function generateFundReceiptNumber(): string {
  const year = new Date().getFullYear()
  const seq = Math.floor(100000 + Math.random() * 900000)
  return `EZ-CF-${year}-${seq}`
}

export function generateFundVerifyToken(): string {
  return randomBytes(24).toString('hex')
}

export type CreditFundReceiptData = {
  receiptNumber: string
  verifyToken: string
  userDisplayName: string
  userEmail?: string | null
  creditsAdded: number
  amountGbp: number
  balanceAfter: number
  completedAt: string
  tierLabel?: string
  printUrl: string
  downloadUrl: string
  verifyUrl: string
}

export function buildCreditFundReceiptHtml(data: CreditFundReceiptData): string {
  const date = new Date(data.completedAt).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Credit fund receipt ${esc(data.receiptNumber)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; }
    .sheet { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .head { background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 24px 28px; }
    .body { padding: 28px; }
    .label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .value { font-size: 1rem; font-weight: 700; margin-top: 4px; }
    .verify { margin-top: 20px; padding: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; font-size: 0.82rem; }
    .btn { display: inline-block; margin-top: 14px; margin-right: 8px; padding: 10px 18px; border-radius: 8px; font-weight: 700; text-decoration: none; }
    .btn-primary { background: #10b981; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #0f172a; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <h1 style="margin:0;font-size:1.35rem">Espeezy Credit Fund Receipt</h1>
      <p style="margin:6px 0 0;opacity:0.9">${esc(data.receiptNumber)} · ${esc(date)}</p>
    </div>
    <div class="body">
      <div style="margin-bottom:16px">
        <div class="label">Account holder</div>
        <div class="value">${esc(data.userDisplayName)}</div>
        ${data.userEmail ? `<div style="font-size:0.85rem;color:#64748b;margin-top:4px">${esc(data.userEmail)}</div>` : ''}
      </div>
      ${data.tierLabel ? `<div style="margin-bottom:16px"><div class="label">Fund tier</div><div class="value">${esc(data.tierLabel)}</div></div>` : ''}
      <div style="margin-bottom:16px"><div class="label">Credits added</div><div class="value">${esc(formatCredits(data.creditsAdded))}</div></div>
      <div style="margin-bottom:16px"><div class="label">Amount paid</div><div class="value">£${data.amountGbp.toFixed(2)}</div></div>
      <div style="margin-bottom:16px"><div class="label">Balance after</div><div class="value">${data.balanceAfter} credits</div></div>
      <div class="verify">
        <strong>Verification</strong><br />
        <a href="${esc(data.verifyUrl)}">${esc(data.verifyUrl)}</a><br />
        Code: <code>${esc(data.verifyToken)}</code>
      </div>
      <div class="no-print">
        <button type="button" class="btn btn-primary" onclick="window.print()">Print</button>
        <a class="btn btn-secondary" href="${esc(data.downloadUrl)}">Download PDF</a>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function buildCreditFundReceiptPdf(data: CreditFundReceiptData): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = 48
  const line = (t: string, size = 11, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.text(t, 48, y)
    y += size + 8
  }
  line('Espeezy Credit Fund Receipt', 16, true)
  line(data.receiptNumber, 10)
  line(`Account: ${data.userDisplayName}`, 12, true)
  if (data.tierLabel) line(`Tier: ${data.tierLabel}`, 10)
  line(`Credits added: ${formatCredits(data.creditsAdded)}`, 11)
  line(`Paid: £${data.amountGbp.toFixed(2)}`, 11)
  line(`Balance after: ${data.balanceAfter} credits`, 11)
  line(`Verify: ${data.verifyUrl}`, 9)
  return Buffer.from(doc.output('arraybuffer') as ArrayBuffer)
}

export function receiptIdFromSession(stripeSessionId: string): string {
  return createHash('sha256').update(stripeSessionId).digest('hex').slice(0, 32)
}

export function resolveFundReceiptProfile(profile: ProfileNameFields | null | undefined): string {
  return resolveProfileDisplayName(profile)
}
