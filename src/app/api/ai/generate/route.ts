import { NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
export const dynamic = 'force-dynamic'


const OPENAI_API_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || process.env.AI_GATEWAY_KEY

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return new NextResponse(JSON.stringify({ error: 'AI API key is not configured.' }), { status: 500 })
  }

  const db = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await db.auth.getUser()

  if (authError || !user) {
    return new NextResponse(JSON.stringify({ error: 'Authentication required.' }), { status: 401 })
  }

  try {
    const { title, category, dueDate, existingDescription } = await req.json()
    if (!title) {
      return new NextResponse(JSON.stringify({ error: 'Task title is required.' }), { status: 400 })
    }

    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await db
      .from('ai_usage')
      .select('id', { count: 'exact' })
      .eq('profile_id', user.id)
      .gte('created_at', windowStart)

    if (countError) {
      return new NextResponse(JSON.stringify({ error: 'Unable to verify AI usage limit.' }), { status: 500 })
    }

    if ((count ?? 0) >= 5) {
      return new NextResponse(JSON.stringify({ error: 'AI usage limit reached. Please try again after 24 hours.' }), { status: 429 })
    }

    const prompt = `Create a polished task description for a collaborative work tracker. Title: ${title.trim()}. Category: ${category}. Due date: ${dueDate ?? 'none'}. ${existingDescription ? 'Use the existing description as a starting point: ' + existingDescription : ''} Respond with a concise, clear task description only.`

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for generating clear task descriptions in a team productivity app.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 220
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new NextResponse(JSON.stringify({ error: `AI request failed: ${errorText}` }), { status: response.status })
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content?.trim()

    if (!text) {
      return new NextResponse(JSON.stringify({ error: 'AI did not return a valid description.' }), { status: 502 })
    }

    await db.from('ai_usage').insert([{ profile_id: user.id, action: 'task_description' }])

    return new NextResponse(JSON.stringify({ description: text }), { status: 200 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI generation failed.'
    return new NextResponse(JSON.stringify({ error: msg }), { status: 500 })
  }
}
