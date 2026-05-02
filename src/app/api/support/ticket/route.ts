import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { notifySupportTicket } from '@/services/email'
export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { summary } = await req.json()

  const svc = await createAdminClient()
  const { data: ticket, error } = await svc
    .from('support_tickets')
    .insert({ user_id: user.id, summary: summary?.slice(0, 2000) ?? '', status: 'escalated' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget email notification — don't block the response
  notifySupportTicket({
    ticketId: ticket.id,
    userId: user.id,
    userEmail: user.email ?? 'unknown',
    summary: summary?.slice(0, 2000) ?? '',
  }).catch(() => {
    // Non-fatal — ticket is still created even if email fails
  })

  return NextResponse.json({ ticket_id: ticket.id }, { status: 201 })
}
