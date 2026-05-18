import { formatCredits } from '@/lib/credits'

export type MarketplaceInvoiceParty = {
  role: 'buyer' | 'seller'
  name: string
  email?: string | null
  creditsAfter: number
}

export type MarketplaceInvoiceData = {
  invoiceNumber: string
  purchaseId: string
  listingTitle: string
  listingCategory?: string | null
  creditsAmount: number
  createdAt: string
  meetupZone?: string | null
  buyer: MarketplaceInvoiceParty
  seller: MarketplaceInvoiceParty
  printUrl: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildMarketplaceInvoiceHtml(data: MarketplaceInvoiceData): string {
  const date = new Date(data.createdAt).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const meetupBlock = data.meetupZone
    ? `<div><div class="label">Meetup</div><div class="value">${escapeHtml(data.meetupZone)}</div></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; }
    .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .head { background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 28px 32px; }
    .head h1 { margin: 0 0 4px; font-size: 1.5rem; }
    .body { padding: 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .value { font-size: 0.95rem; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .total { font-size: 1.25rem; font-weight: 800; color: #059669; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .party { padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; }
    .party h3 { margin: 0 0 8px; font-size: 0.8rem; text-transform: uppercase; color: #065f46; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <h1>Espeezy Marketplace Invoice</h1>
      <p>${escapeHtml(data.invoiceNumber)} · ${escapeHtml(date)}</p>
    </div>
    <div class="body">
      <div class="grid">
        <div><div class="label">Item</div><div class="value">${escapeHtml(data.listingTitle)}</div></div>
        <div><div class="label">Category</div><div class="value">${escapeHtml(data.listingCategory || '—')}</div></div>
        ${meetupBlock}
        <div><div class="label">Purchase ID</div><div class="value"><code>${escapeHtml(data.purchaseId)}</code></div></div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody><tr><td>Marketplace purchase</td><td class="total">${escapeHtml(formatCredits(data.creditsAmount))}</td></tr></tbody>
      </table>
      <div class="parties">
        <div class="party">
          <h3>Buyer</h3>
          <div class="value">${escapeHtml(data.buyer.name)}</div>
          <div style="margin-top:8px;font-size:0.85rem">Balance after: <strong>${data.buyer.creditsAfter} credits</strong></div>
        </div>
        <div class="party">
          <h3>Seller</h3>
          <div class="value">${escapeHtml(data.seller.name)}</div>
          <div style="margin-top:8px;font-size:0.85rem">Balance after: <strong>${data.seller.creditsAfter} credits</strong></div>
        </div>
      </div>
      <div class="footer">
        Completed Espeezy credits transaction. Coordinate meetup per listing details.
        <div class="no-print" style="margin-top:16px">
          <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer">Print invoice</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}
