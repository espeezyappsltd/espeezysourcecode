import { NextResponse } from 'next/server'
import { requireStudioOperator } from '@/lib/auth/studio-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchJobBundle } from '@/lib/jobs/fetch-bundle'
import {
  generateFinalReport,
  generatePrdMarkdown,
  generateRequirementsTxt,
  nextInvoiceNumber,
  nextReceiptNumber,
} from '@/lib/jobs/documents'
import { sendStudioDeliveryEmail } from '@/lib/email'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireStudioOperator()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { id: jobId } = await ctx.params
  const admin = createAdminClient()
  const bundle = await fetchJobBundle(admin, jobId)

  if (!bundle) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const clientEmail = bundle.job.client_email?.trim()
  if (!clientEmail) {
    return NextResponse.json({ error: 'Set client email on the job before delivery.' }, { status: 400 })
  }

  const invoiceNumber = bundle.job.invoice_number || nextInvoiceNumber(jobId)
  const receiptNumber = bundle.job.receipt_number || nextReceiptNumber(invoiceNumber)

  const requirementsTxt = generateRequirementsTxt(bundle)
  const prdMd = bundle.job.prd_text?.trim() || generatePrdMarkdown(bundle)
  const finalReport = generateFinalReport(bundle, invoiceNumber, receiptNumber)

  const currency = bundle.job.currency || 'GBP'
  const totalCents =
    bundle.budgetEntries.reduce((s, e) => s + e.amount_cents, 0) ||
    bundle.job.budget_cents ||
    0
  const amountLabel =
    currency === 'GBP'
      ? `£${(totalCents / 100).toFixed(2)}`
      : `${(totalCents / 100).toFixed(2)} ${currency}`

  try {
    await sendStudioDeliveryEmail({
      to: clientEmail,
      clientName: bundle.job.client_name || 'Client',
      projectTitle: bundle.job.title,
      invoiceNumber,
      receiptNumber,
      amountLabel,
      reportExcerpt: finalReport,
      attachments: [
        { filename: 'requirements.txt', content: requirementsTxt },
        { filename: 'PRD.md', content: prdMd },
        { filename: 'final-delivery-report.md', content: finalReport },
        {
          filename: 'invoice.txt',
          content: [
            'ESPEEZY STUDIOS: INVOICE',
            `Invoice: ${invoiceNumber}`,
            `Receipt: ${receiptNumber}`,
            `Project: ${bundle.job.title}`,
            `Client: ${bundle.job.client_name}`,
            `Amount: ${amountLabel}`,
            `Date: ${new Date().toISOString()}`,
          ].join('\n'),
        },
        {
          filename: 'receipt.txt',
          content: [
            'ESPEEZY STUDIOS: PAYMENT RECEIPT',
            `Receipt: ${receiptNumber}`,
            `Invoice: ${invoiceNumber}`,
            `Paid by: ${bundle.job.client_name}`,
            `Amount: ${amountLabel}`,
            `Status: PAID`,
          ].join('\n'),
        },
      ],
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Email delivery failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const now = new Date().toISOString()

  await admin
    .from('jobs')
    .update({
      requirements_text: requirementsTxt,
      prd_text: prdMd,
      final_report_text: finalReport,
      invoice_number: invoiceNumber,
      receipt_number: receiptNumber,
      delivery_status: 'delivered',
      last_delivered_at: now,
      status: bundle.job.status === 'done' ? 'done' : 'review',
      updated_at: now,
    })
    .eq('id', jobId)

  await admin.from('studio_job_delivery_logs').insert({
    job_id: jobId,
    sent_to: clientEmail,
    invoice_number: invoiceNumber,
    receipt_number: receiptNumber,
    delivery_status: 'sent',
    sent_at: now,
    created_by: auth.user.id,
  })

  await admin.from('studio_job_timeline_events').insert({
    job_id: jobId,
    title: 'Delivery package sent',
    description: `Emailed to ${clientEmail} with invoice ${invoiceNumber}`,
    event_at: now,
    kind: 'delivery',
  })

  return NextResponse.json({
    ok: true,
    invoiceNumber,
    receiptNumber,
    sentTo: clientEmail,
  })
}
