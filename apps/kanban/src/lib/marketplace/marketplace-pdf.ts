import { jsPDF } from 'jspdf'
import { formatCredits } from '@/lib/credits'
import type { MarketplaceDocumentData } from '@/lib/marketplace/document-html'
import { documentTitleForKind } from '@/lib/marketplace/document-types'

export function buildMarketplaceDocumentPdf(data: MarketplaceDocumentData): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  let y = margin
  const line = (text: string, size = 11, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, 520)
    doc.text(lines, margin, y)
    y += lines.length * (size + 4)
  }

  const title = documentTitleForKind(data.kind)
  const fee = data.platformFeeCredits ?? 0
  const net = data.sellerNetCredits ?? Math.max(0, data.creditsAmount - fee)
  const date = new Date(data.createdAt).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  line('Espeezy Marketplace', 10)
  line(title, 18, true)
  line(`${data.invoiceNumber} · ${date}`, 10)
  y += 8
  line(`Item: ${data.listingTitle}`, 11)
  line(`Category: ${data.listingCategory || '—'}`, 10)
  if (data.meetupZone) line(`Meetup: ${data.meetupZone}`, 10)
  y += 6

  if (data.kind === 'receipt' && fee > 0) {
    line(`Gross: ${formatCredits(data.creditsAmount)}`, 11)
    line(`Platform fee: −${formatCredits(fee)}`, 11)
    line(`Net received: ${formatCredits(net)}`, 12, true)
  } else if (data.kind === 'invoice') {
    line(`Amount paid: ${formatCredits(data.creditsAmount)}`, 12, true)
  } else {
    line(`Amount received: ${formatCredits(net)}`, 12, true)
  }

  y += 10
  line('Buyer', 11, true)
  line(data.buyer.name, 12, true)
  if (data.buyer.email) line(data.buyer.email, 10)
  line(`Balance after: ${data.buyer.creditsAfter} credits`, 10)
  y += 8
  line('Seller', 11, true)
  line(data.seller.name, 12, true)
  if (data.seller.email) line(data.seller.email, 10)
  line(`Balance after: ${data.seller.creditsAfter} credits`, 10)
  y += 10
  line(`Transaction ID: ${data.purchaseId}`, 9)
  line(`Verify: ${data.verifyUrl}`, 9)
  line(`Code: ${data.verifyToken}`, 9)

  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
  return Buffer.from(arrayBuffer)
}
