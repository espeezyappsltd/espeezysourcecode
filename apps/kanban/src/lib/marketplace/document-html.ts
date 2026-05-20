import { formatCredits } from '@/lib/credits'
import type { MarketplaceDocumentKind } from '@/lib/marketplace/document-types'
import { documentTitleForKind } from '@/lib/marketplace/document-types'

export type MarketplaceDocumentParty = {
  role: 'buyer' | 'seller'
  name: string
  email?: string | null
  creditsAfter: number
}

export type MarketplaceDocumentData = {
  kind: MarketplaceDocumentKind
  invoiceNumber: string
  purchaseId: string
  verifyToken: string
  listingTitle: string
  listingCategory?: string | null
  creditsAmount: number
  platformFeeCredits?: number
  sellerNetCredits?: number
  createdAt: string
  meetupZone?: string | null
  buyer: MarketplaceDocumentParty
  seller: MarketplaceDocumentParty
  printUrl: string
  downloadUrl: string
  verifyUrl: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildMarketplaceDocumentHtml(data: MarketplaceDocumentData): string {
  const date = new Date(data.createdAt).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const title = documentTitleForKind(data.kind)
  const headerSubtitle =
    data.kind === 'invoice'
      ? 'Buyer copy — payment record for your purchase'
      : 'Seller copy — payment record for your sale'

  const meetupBlock = data.meetupZone
    ? `<div><div class="label">Meetup</div><div class="value">${escapeHtml(data.meetupZone)}</div></div>`
    : ''

  const fee = data.platformFeeCredits ?? 0
  const net = data.sellerNetCredits ?? Math.max(0, data.creditsAmount - fee)

  const amountRows =
    data.kind === 'receipt' && fee > 0
      ? `<tr><td>Gross sale</td><td>${escapeHtml(formatCredits(data.creditsAmount))}</td></tr>
         <tr><td>Platform fee</td><td>−${escapeHtml(formatCredits(fee))}</td></tr>
         <tr><td><strong>Net received</strong></td><td class="total">${escapeHtml(formatCredits(net))}</td></tr>`
      : data.kind === 'invoice'
        ? `<tr><td>Amount paid</td><td class="total">${escapeHtml(formatCredits(data.creditsAmount))}</td></tr>`
        : `<tr><td>Amount received</td><td class="total">${escapeHtml(formatCredits(net))}</td></tr>`

  const viewerParty = data.kind === 'invoice' ? data.buyer : data.seller
  const counterparty = data.kind === 'invoice' ? data.seller : data.buyer

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; }
    .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .head { background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 28px 32px; }
    .head h1 { margin: 0 0 4px; font-size: 1.45rem; }
    .head p { margin: 4px 0 0; opacity: 0.92; font-size: 0.9rem; }
    .body { padding: 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .value { font-size: 0.95rem; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .total { font-size: 1.2rem; font-weight: 800; color: #059669; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .party { padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; }
    .party h3 { margin: 0 0 8px; font-size: 0.8rem; text-transform: uppercase; color: #065f46; }
    .party .name { font-size: 1.05rem; font-weight: 800; }
    .party .email { font-size: 0.8rem; color: #475569; margin-top: 4px; }
    .verify { margin-top: 24px; padding: 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; font-size: 0.82rem; }
    .verify code { font-size: 0.75rem; word-break: break-all; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
    .btn { display: inline-block; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; text-decoration: none; cursor: pointer; border: none; }
    .btn-primary { background: #10b981; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #0f172a; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b; }
    @media print { .no-print { display: none; } body { padding: 0; } }
    @media (max-width: 560px) { .grid, .parties { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(headerSubtitle)}</p>
      <p>${escapeHtml(data.invoiceNumber)} · ${escapeHtml(date)}</p>
    </div>
    <div class="body">
      <div class="grid">
        <div><div class="label">Item</div><div class="value">${escapeHtml(data.listingTitle)}</div></div>
        <div><div class="label">Category</div><div class="value">${escapeHtml(data.listingCategory || '—')}</div></div>
        ${meetupBlock}
        <div><div class="label">Transaction ID</div><div class="value"><code>${escapeHtml(data.purchaseId)}</code></div></div>
        <div><div class="label">Your role</div><div class="value">${escapeHtml(viewerParty.role === 'buyer' ? 'Buyer' : 'Seller')}</div></div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>${amountRows}</tbody>
      </table>
      <div class="parties">
        <div class="party">
          <h3>Buyer</h3>
          <div class="name">${escapeHtml(data.buyer.name)}</div>
          ${data.buyer.email ? `<div class="email">${escapeHtml(data.buyer.email)}</div>` : ''}
          <div style="margin-top:8px;font-size:0.85rem">Balance after: <strong>${data.buyer.creditsAfter} credits</strong></div>
        </div>
        <div class="party">
          <h3>Seller</h3>
          <div class="name">${escapeHtml(data.seller.name)}</div>
          ${data.seller.email ? `<div class="email">${escapeHtml(data.seller.email)}</div>` : ''}
          <div style="margin-top:8px;font-size:0.85rem">Balance after: <strong>${data.seller.creditsAfter} credits</strong></div>
        </div>
      </div>
      <p style="margin-top:20px;font-size:0.9rem;color:#475569">
        ${data.kind === 'invoice'
          ? `You paid <strong>${escapeHtml(formatCredits(data.creditsAmount))}</strong> to <strong>${escapeHtml(counterparty.name)}</strong>.`
          : `You received <strong>${escapeHtml(formatCredits(net))}</strong> from <strong>${escapeHtml(counterparty.name)}</strong>.`}
      </p>
      <div class="verify">
        <strong>Verification</strong><br />
        This document is authentic. Verify at:<br />
        <a href="${escapeHtml(data.verifyUrl)}">${escapeHtml(data.verifyUrl)}</a><br />
        Verification code: <code>${escapeHtml(data.verifyToken)}</code>
      </div>
      <div class="actions no-print">
        <button type="button" class="btn btn-primary" onclick="window.print()">Print</button>
        <a class="btn btn-secondary" href="${escapeHtml(data.downloadUrl)}">Download PDF</a>
      </div>
      <div class="footer">
        Espeezy Marketplace · Completed credits transaction. Both parties retain invoice (buyer) and receipt (seller) copies.
      </div>
    </div>
  </div>
</body>
</html>`
}
