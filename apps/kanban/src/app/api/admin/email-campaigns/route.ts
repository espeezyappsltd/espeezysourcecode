import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'
import { sendEmail } from '@/services/email'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const DEFAULT_NOTIFICATION_MESSAGE = 'New announcement from Espeezy.'
const MAX_ERROR_SAMPLE_SIZE = 10

// ── Auth helper ──────────────────────────────────────────────────────────────
async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const profile = await getUserProfile(user.uid)
  if (!profile) {
    return { user: null, error: NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 }) }
  }
  if ((profile as Profile).role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}

// ── GET /api/admin/email-campaigns ──────────────────────────────────────────
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const db = getAdminDb()

  try {
    const { data, error: dbErr } = await db
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (dbErr) {
      throw dbErr
    }

    return NextResponse.json({ campaigns: data ?? [] })
  } catch (dbErr: unknown) {
    return NextResponse.json({ error: dbErr instanceof Error ? dbErr.message : 'unknown error' }, { status: 500 })
  }
}

// ── Schema ───────────────────────────────────────────────────────────────────
const CampaignSchema = z.object({
  title:     z.string().min(1).max(200),
  subject:   z.string().min(1).max(300),
  preview:   z.string().max(200).optional(),
  html_body: z.string().min(1),
  text_body: z.string().optional(),
})

interface Recipient {
  id: string
  email: string
  full_name: string | null
}

// ── POST /api/admin/email-campaigns ─────────────────────────────────────────
export async function POST(req: Request) {
  const { user, error: authErr } = await requireAdmin()
  if (authErr) return authErr

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 422 })
  }

  const parsed = CampaignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { title, subject, preview, html_body, text_body: rawTextBody } = parsed.data
  const text_body = rawTextBody ?? html_body.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim()
  
  const db = getAdminDb()

  let campaignId: string
  try {
    const { data: campaign, error: insertErr } = await db
      .from('marketing_campaigns')
      .insert({
        title,
        subject,
        preview,
        html_body,
        text_body,
        status: 'sending',
        created_by: user!.uid,
      })
      .select('id')
      .single()

    if (insertErr || !campaign) {
      throw insertErr ?? new Error('Insert failed')
    }

    campaignId = campaign.id
  } catch (insertErr: unknown) {
    return NextResponse.json({ error: insertErr instanceof Error ? insertErr.message : 'Insert failed' }, { status: 500 })
  }

  // 2. Fetch all opted-in users
  let list: Recipient[] = []
  try {
    const { data: recipients, error: recipientsErr } = await db
      .from('profiles')
      .select('id, email, full_name')
      .eq('marketing_emails', true)

    if (recipientsErr) {
      throw recipientsErr
    }

    list = (recipients ?? [])
      .map((recipient) => ({ id: recipient.id, email: recipient.email, full_name: recipient.full_name }))
      .filter(r => !!r.email)
  } catch (recipientsErr: unknown) {
    await db.from('marketing_campaigns').update({ status: 'failed' }).eq('id', campaignId)
    return NextResponse.json({ error: recipientsErr instanceof Error ? recipientsErr.message : 'Failed to fetch recipients' }, { status: 500 })
  }

  let sentCount = 0
  const errors: string[] = []

  // 3. Send emails in batches
  const BATCH = 20
  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(async (r) => {
        try {
          const personalHtml = `${html_body}
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">
  You received this because you opted in to marketing updates.
  <a href="https://espeezy.com/dashboard/notifications" style="color:#10b981">Manage preferences</a>
</div>`
          await sendEmail({
            to: r.email,
            subject,
            html: personalHtml,
            text: text_body,
          })
          sentCount++
        } catch (e) {
          errors.push(`${r.email}: ${(e as Error).message}`)
        }
      })
    )
  }

  // 4. Insert persistent in-app notifications
  if (list.length > 0) {
    const notifRows = list.map((r) => ({
      user_id: r.id,
      type: 'marketing',
      title: subject,
      message: preview ?? text_body?.slice(0, 160) ?? DEFAULT_NOTIFICATION_MESSAGE,
      link: null,
      read: false,
      created_at: new Date().toISOString()
    }))

    for (let i = 0; i < notifRows.length; i += 500) {
      const chunk = notifRows.slice(i, i + 500)
      
      try {
        const { error: notifErr } = await db.from('notifications').insert(chunk)
        if (notifErr) {
          throw notifErr
        }
      } catch (notifErr: unknown) {
        const message = notifErr instanceof Error ? notifErr.message : 'unknown error'
        await db.from('marketing_campaigns').update({
          status: 'sent',
          sent_count: sentCount,
          sent_at: new Date().toISOString()
        }).eq('id', campaignId)
        return NextResponse.json({
          error: 'Emails sent but notifications failed',
          details: message,
          campaign_id: campaignId,
          sent_count: sentCount,
          total_recipients: list.length,
        }, { status: 500 })
      }
    }
  }

  // 5. Mark campaign sent
  const finalStatus = errors.length === list.length && list.length > 0 ? 'failed' : 'sent'
  try {
    const { error: finalUpdateErr } = await db
      .from('marketing_campaigns')
      .update({
      status: finalStatus,
      sent_count: sentCount,
      sent_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (finalUpdateErr) {
      throw finalUpdateErr
    }
  } catch (finalUpdateErr: unknown) {
    return NextResponse.json({
      error: 'Failed to update campaign status',
      details: finalUpdateErr instanceof Error ? finalUpdateErr.message : 'unknown error',
      campaign_id: campaignId,
      sent_count: sentCount,
      total_recipients: list.length,
    }, { status: 500 })
  }

  return NextResponse.json({
    campaign_id: campaignId,
    sent_count: sentCount,
    total_recipients: list.length,
    errors_count: errors.length,
    errors: errors.length > 0 ? errors.slice(0, MAX_ERROR_SAMPLE_SIZE) : undefined,
  })
}
