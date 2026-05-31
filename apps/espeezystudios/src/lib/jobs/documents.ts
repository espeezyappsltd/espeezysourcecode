import type { JobBundle } from './types'

function fmtMoney(cents: number, currency: string) {
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : `${currency} `
  return `${sym}${(cents / 100).toFixed(2)}`
}

function fmtDate(iso?: string | null) {
  if (!iso) return 'TBD'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateRequirementsTxt(bundle: JobBundle): string {
  const { job, milestones } = bundle
  const lines = [
    '# Espeezy Studios — Requirements',
    `# Project: ${job.title}`,
    `# Client: ${job.client_name || '—'}`,
    `# Deadline: ${fmtDate(job.deadline_at)}`,
    `# Generated: ${new Date().toISOString()}`,
    '',
    '## Scope summary',
    job.description || '(No description)',
    '',
    '## Functional requirements',
    ...(job.requirements_text
      ? job.requirements_text.split('\n').map((l) => (l.startsWith('-') ? l : `- ${l}`))
      : ['- Define core user flows', '- Authentication & roles', '- Data persistence', '- Admin reporting']),
    '',
    '## Milestones to satisfy',
    ...milestones.map(
      (m, i) =>
        `${i + 1}. [${m.status}] ${m.title} — due ${fmtDate(m.due_at)}${m.description ? `\n   ${m.description}` : ''}`,
    ),
    '',
    '## Non-functional',
    '- Security: RLS, HTTPS, secrets in env only',
    '- Performance: sub-3s page loads on 4G',
    '- Accessibility: WCAG 2.1 AA targets',
    '- Delivery: PRD sign-off, staged milestones, final report + invoice',
    '',
    '## Acceptance',
    '- All milestones marked complete',
    '- Client sign-off on final report',
    '- Invoice & receipt emailed to client',
  ]
  return lines.join('\n')
}

export function generatePrdMarkdown(bundle: JobBundle): string {
  const { job, milestones, budgetEntries, timeline } = bundle
  const budgetTotal = budgetEntries.reduce((s, e) => s + e.amount_cents, 0)
  const currency = job.currency || 'GBP'

  return `# Product Requirements Document

## ${job.title}

| Field | Value |
|-------|-------|
| Client | ${job.client_name || '—'} |
| Status | ${job.status} |
| Delivery | ${job.delivery_status || 'draft'} |
| Budget (line items) | ${fmtMoney(budgetTotal, currency)} |
| Deadline | ${fmtDate(job.deadline_at)} |

## Problem statement

${job.description || 'TBD'}

## Goals

1. Deliver on time against agreed milestones
2. Stay within budget with transparent line items
3. Hand off documentation, invoice, and receipt

## Requirements

${job.requirements_text || job.prd_text || '_See requirements.txt_'}

## Milestones

${milestones.length === 0 ? '_No milestones defined._' : milestones.map((m) => `### ${m.title}\n- Status: **${m.status}**\n- Due: ${fmtDate(m.due_at)}\n- ${m.description || ''}`).join('\n\n')}

## Timeline

${timeline.length === 0 ? '_No events logged._' : timeline.map((e) => `- **${fmtDate(e.event_at)}** [${e.kind}] ${e.title} — ${e.description || ''}`).join('\n')}

## Budget breakdown

${budgetEntries.length === 0 ? '_No budget lines._' : budgetEntries.map((b) => `- ${b.label} (${b.entry_type}): ${fmtMoney(b.amount_cents, currency)}`).join('\n')}

## Out of scope

- Third-party licensing fees unless listed in budget
- Post-launch support beyond agreed warranty window

## Sign-off

Client: _____________________  Date: ___________

Espeezy Studios: _____________________  Date: ___________
`
}

export function generateFinalReport(bundle: JobBundle, invoiceNumber: string, receiptNumber: string): string {
  const { job, milestones, budgetEntries, timeline, deliveryLogs } = bundle
  const currency = job.currency || 'GBP'
  const budgetTotal = budgetEntries.reduce((s, e) => s + e.amount_cents, 0)
  const doneMilestones = milestones.filter((m) => m.status === 'done' || m.status === 'completed').length

  return `# Final Delivery Report

**Project:** ${job.title}  
**Client:** ${job.client_name || '—'} (${job.client_email || '—'})  
**Report date:** ${fmtDate(new Date().toISOString())}  
**Invoice:** ${invoiceNumber}  
**Receipt:** ${receiptNumber}

---

## Executive summary

Espeezy Studios has completed delivery for **${job.title}**. This report summarizes timeline, budget, milestones, and financial documents transmitted to the client.

## Delivery status

| Metric | Value |
|--------|-------|
| Job status | ${job.status} |
| Milestones complete | ${doneMilestones} / ${milestones.length} |
| Budget total | ${fmtMoney(budgetTotal, currency)} |
| Deadline | ${fmtDate(job.deadline_at)} |
| Completed | ${fmtDate(job.completed_at)} |

## Timeline (full)

${timeline.map((e) => `1. **${fmtDate(e.event_at)}** — ${e.title} (${e.kind})${e.description ? `\n   ${e.description}` : ''}`).join('\n') || '_No timeline events._'}

## Milestones

${milestones.map((m) => `- **${m.title}** — ${m.status} (due ${fmtDate(m.due_at)})`).join('\n') || '_None_'}

## Budget entries

${budgetEntries.map((b) => `- ${b.label}: ${fmtMoney(b.amount_cents, currency)} [${b.entry_type}]`).join('\n') || '_None_'}

## Documents included in package

1. \`requirements.txt\` — technical & functional requirements
2. \`PRD.md\` — product requirements document
3. This final report
4. Client invoice **${invoiceNumber}**
5. Payment receipt **${receiptNumber}**

## Delivery history

${deliveryLogs.map((d) => `- ${fmtDate(d.sent_at)} → ${d.sent_to} (${d.delivery_status})`).join('\n') || '_First delivery with this report._'}

---

*Generated by Espeezy Studios Delivery System*
`
}

export function nextInvoiceNumber(jobId: string): string {
  const short = jobId.replace(/-/g, '').slice(0, 8).toUpperCase()
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `INV-STU-${stamp}-${short}`
}

export function nextReceiptNumber(invoiceNumber: string): string {
  return invoiceNumber.replace(/^INV-/, 'RCT-')
}
