import { NextRequest, NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are a friendly support assistant for espeezy.com, an academic collaboration and earning platform for students.

Your capabilities:
- Answer questions about espeezy.com features: Feed, Side Hustle marketplace, tasks, profile, settings, payments, groups, notifications
- Explain how to earn money via the Side Hustle tab and connect a bank account via Stripe
- Guide users through platform features step by step
- Provide general troubleshooting tips

Your strict limitations:
- You CANNOT perform any database actions, account changes, or financial transactions
- You CANNOT access user data, account balances, or transaction history
- For account suspensions, payment disputes, or sensitive issues: always direct the user to human support
- For any security concern: always escalate to humans

When a user needs human support, say: "For this issue, please contact our team at support@espeezy.com or click 'Talk to a Human' below."

Keep responses concise and friendly. Use markdown formatting where helpful.`

export async function POST(req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, ticket_id } = await req.json()
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI support temporarily unavailable.' }, { status: 503 })
  }

  // Rate limit: max 20 AI messages per hour per user
  const svc = await createAdminClient()
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
  const { count: aiMsgCount } = await svc
    .from('support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender', 'ai')
    .gte('created_at', oneHourAgo)
    .limit(1)

  if (typeof aiMsgCount === 'number' && aiMsgCount >= 20) {
    return NextResponse.json({ error: 'AI rate limit reached. Please try again in an hour.' }, { status: 429 })
  }

  // Build message array for OpenAI
  const chatMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 1000),
    })),
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.4,
      stream: false,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('OpenAI error:', err)
    return NextResponse.json({ error: 'AI response failed. Please try again.' }, { status: 502 })
  }

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'

  // Log to support_messages if ticket provided
  if (ticket_id) {
    try {
      await svc.from('support_messages').insert([
        { ticket_id, sender: 'user', content: messages[messages.length - 1]?.content ?? '' },
        { ticket_id, sender: 'ai', content: reply },
      ])
    } catch { /* non-critical log */ }
  }

  return NextResponse.json({ reply })
}
