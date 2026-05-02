import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  try {
    const { name, email, category, message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const db = await createServerSupabaseClient()
    const { data: { user } } = await db.auth.getUser().catch(() => ({ data: { user: null } }))

    const adminClient = await createAdminClient()
    
    // Format message to include sender details if anonymous
    const finalMessage = user 
      ? message 
      : `Sender: ${name} <${email}>\n\n${message}`

    const { error } = await adminClient
      .from('user_feedback')
      .insert({
        user_id: user?.id || null,
        message: finalMessage,
        category: category || 'General',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Feedback submission error:', error)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
