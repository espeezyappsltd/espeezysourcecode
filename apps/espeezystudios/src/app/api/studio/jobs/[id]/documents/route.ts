import { NextResponse } from 'next/server'
import { fetchJobBundle } from '@/lib/jobs/fetch-bundle'
import {
  generateFinalReport,
  generatePrdMarkdown,
  generateRequirementsTxt,
  nextInvoiceNumber,
  nextReceiptNumber,
} from '@/lib/jobs/documents'
import { createAdminClient } from '@/lib/supabase/admin'

/** GET ?type=requirements|prd|report — download generated document */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await ctx.params
  const type = new URL(req.url).searchParams.get('type') ?? 'requirements'

  let db
  try {
    db = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
  }

  const bundle = await fetchJobBundle(db, jobId)
  if (!bundle) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const inv = bundle.job.invoice_number || nextInvoiceNumber(jobId)
  const rec = bundle.job.receipt_number || nextReceiptNumber(inv)

  let content: string
  let filename: string
  let contentType: string

  switch (type) {
    case 'prd':
      content = bundle.job.prd_text || generatePrdMarkdown(bundle)
      filename = 'PRD.md'
      contentType = 'text/markdown; charset=utf-8'
      break
    case 'report':
      content = bundle.job.final_report_text || generateFinalReport(bundle, inv, rec)
      filename = 'final-delivery-report.md'
      contentType = 'text/markdown; charset=utf-8'
      break
    case 'invoice':
      content = [
        'ESPEEZY STUDIOS — INVOICE',
        `Invoice: ${inv}`,
        `Project: ${bundle.job.title}`,
        `Client: ${bundle.job.client_name}`,
      ].join('\n')
      filename = 'invoice.txt'
      contentType = 'text/plain; charset=utf-8'
      break
  default:
      content = bundle.job.requirements_text || generateRequirementsTxt(bundle)
      filename = 'requirements.txt'
      contentType = 'text/plain; charset=utf-8'
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
