import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchJobBundle } from '@/lib/jobs/fetch-bundle'
import {
  generateFinalReport,
  generatePrdMarkdown,
  generateRequirementsTxt,
  nextInvoiceNumber,
  nextReceiptNumber,
} from '@/lib/jobs/documents'
import type { StudioJob } from '@/lib/jobs/types'

export type AgentTaskResult = {
  ok: boolean
  error?: string
  job?: StudioJob
  task?: unknown
}

export async function runAgentTask(
  admin: SupabaseClient,
  taskId: string,
  jobId: string,
  prompt: string,
  userId: string,
): Promise<AgentTaskResult> {
  const startedAt = new Date().toISOString()

  await admin
    .from('studio_agent_tasks')
    .update({ status: 'running', started_at: startedAt, updated_at: startedAt })
    .eq('id', taskId)

  try {
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle()

    if (jobError || !job) {
      throw new Error(jobError?.message ?? 'Job not found for the agent task.')
    }

    const requirementsText = buildAgentRequirements(job, prompt)
    const prdText = buildAgentPrd(job, prompt)
    const milestoneItems = buildAgentMilestones(jobId, prompt)
    const budgetItems = buildAgentBudgetEntries(jobId, job)
    const timelineEvents = buildAgentTimelineEvents(jobId, prompt)

    if (milestoneItems.length > 0) {
      await admin.from('studio_job_milestones').insert(milestoneItems)
    }

    if (budgetItems.length > 0) {
      await admin.from('studio_job_budget_entries').insert(budgetItems)
    }

    if (timelineEvents.length > 0) {
      await admin.from('studio_job_timeline_events').insert(timelineEvents)
    }

    const draftUpdate = {
      requirements_text: requirementsText,
      prd_text: prdText,
      started_at: startedAt,
      status: 'review',
      delivery_status: 'draft',
      updated_at: startedAt,
    }

    await admin.from('jobs').update(draftUpdate).eq('id', jobId)

    const bundle = await fetchJobBundle(admin, jobId)
    const invoiceNumber = nextInvoiceNumber(jobId)
    const receiptNumber = nextReceiptNumber(invoiceNumber)
    const finalReport = bundle
      ? generateFinalReport(bundle, invoiceNumber, receiptNumber)
      : buildFallbackFinalReport(job, prompt, invoiceNumber, receiptNumber)

    await admin
      .from('jobs')
      .update({ final_report_text: finalReport, updated_at: new Date().toISOString() })
      .eq('id', jobId)

    const completedAt = new Date().toISOString()
    await admin
      .from('studio_agent_tasks')
      .update({
        status: 'completed',
        completed_at: completedAt,
        result_text: 'Agent task fulfilled and project seed created.',
        updated_at: completedAt,
      })
      .eq('id', taskId)

    const { data: updatedJob } = await admin.from('jobs').select('*').eq('id', jobId).maybeSingle()
    const { data: updatedTask } = await admin.from('studio_agent_tasks').select('*').eq('id', taskId).maybeSingle()

    return { ok: true, job: updatedJob ?? job, task: updatedTask ?? null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown agent task error.'
    await admin
      .from('studio_agent_tasks')
      .update({ status: 'failed', completed_at: new Date().toISOString(), result_text: message, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    return { ok: false, error: message }
  }
}

function buildAgentRequirements(job: StudioJob, prompt: string): string {
  return [
    `# Requirements for ${job.title}`,
    `Client: ${job.client_name || 'Studio client'}`,
    '',
    prompt.trim(),
    '',
    '## Expected deliverables',
    '- Production-ready Next.js client application',
    '- Supabase client database integration',
    '- Sign in / sign up flow',
    '- Responsive landing page and sample route pages',
    '- Deployment and run instructions',
  ].join('\n')
}

function buildAgentPrd(job: StudioJob, prompt: string): string {
  return [
    `# Product Requirements Document: ${job.title}`,
    '',
    `**Client:** ${job.client_name || 'Studio client'}`,
    `**Primary ask:** ${prompt.trim()}`,
    '',
    '## Goals',
    '- Ship a polished client-facing Next.js experience',
    '- Use Supabase for authentication and data persistence',
    '- Keep starter content responsive across devices',
    '',
    '## Requirements',
    prompt.trim(),
    '',
    '## Acceptance criteria',
    '- Application compiles and runs cleanly',
    '- Supabase authentication and data flows are wired',
    '- Pages render correctly on mobile and desktop',
    '- Delivery package includes requirements, PRD, and final report',
  ].join('\n')
}

function buildAgentMilestones(jobId: string, prompt: string) {
  const baseTime = Date.now()
  const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000

  return [
    {
      job_id: jobId,
      title: 'Define architecture and user flows',
      description: 'Capture the client site structure, authentication points, and Supabase data model.',
      due_at: new Date(baseTime + daysToMs(7)).toISOString(),
      status: 'pending',
      sort_order: 0,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      job_id: jobId,
      title: 'Implement authentication and Supabase integration',
      description: 'Build sign in, sign up, and the primary database-backed page flows.',
      due_at: new Date(baseTime + daysToMs(14)).toISOString(),
      status: 'pending',
      sort_order: 1,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      job_id: jobId,
      title: 'Deliver responsive UI and deployment notes',
      description: 'Add responsive styling, sample content, and instructions for deployment.',
      due_at: new Date(baseTime + daysToMs(21)).toISOString(),
      status: 'pending',
      sort_order: 2,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

function buildAgentBudgetEntries(jobId: string, job: StudioJob) {
  const currency = job.currency || 'GBP'
  const baseValue = currency === 'USD' ? 120000 : 100000
  return [
    {
      job_id: jobId,
      label: 'Architecture & planning',
      amount_cents: Math.round(baseValue * 0.4),
      entry_type: 'estimate',
      notes: 'Initial plan, data model, and page flow definition.',
      entry_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      job_id: jobId,
      label: 'Authentication and data integration',
      amount_cents: Math.round(baseValue * 0.4),
      entry_type: 'estimate',
      notes: 'Auth flows, Supabase client DB integration, and protected pages.',
      entry_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      job_id: jobId,
      label: 'UI polish and deployment package',
      amount_cents: Math.round(baseValue * 0.2),
      entry_type: 'estimate',
      notes: 'Responsive UI styling, accessibility review, and deployment instructions.',
      entry_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

function buildAgentTimelineEvents(jobId: string, prompt: string) {
  const now = new Date().toISOString()

  return [
    {
      job_id: jobId,
      title: 'Agent task received',
      description: prompt.trim(),
      event_at: now,
      kind: 'kickoff',
      created_at: now,
      updated_at: now,
    },
    {
      job_id: jobId,
      title: 'Agent seed completed',
      description: 'Project requirements, PRD, milestones, and budget items were generated.',
      event_at: now,
      kind: 'milestone',
      created_at: now,
      updated_at: now,
    },
  ]
}

function buildFallbackFinalReport(
  job: StudioJob,
  prompt: string,
  invoiceNumber: string,
  receiptNumber: string,
): string {
  return [
    `# Final Delivery Report for ${job.title}`,
    '',
    `Client: ${job.client_name || 'Studio client'}`,
    `Project prompt: ${prompt}`,
    '',
    `Invoice: ${invoiceNumber}`,
    `Receipt: ${receiptNumber}`,
    '',
    'This report summarizes the initial agent-generated project seed.',
  ].join('\n')
}
