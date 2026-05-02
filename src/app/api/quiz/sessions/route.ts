import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

const StartSchema = z.object({
  category_id:    z.string().uuid(),
  tournament_id:  z.string().uuid().optional(),
  question_count: z.number().int().min(5).max(20).optional().default(10),
})

// POST /api/quiz/sessions — start a new quiz session, returns first question
export async function POST(req: NextRequest) {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = StartSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 })
  }

  const { category_id, tournament_id, question_count } = parsed.data

  const admin = await createAdminClient()

  // Validate category
  const { data: category } = await admin
    .from('quiz_categories')
    .select('id, name, difficulty_tier, prize_pool_cents, is_active')
    .eq('id', category_id)
    .single()

  if (!category || !category.is_active) {
    return NextResponse.json({ error: 'Category not found or inactive' }, { status: 404 })
  }

  // If tournament, validate
  if (tournament_id) {
    const { data: tournament } = await admin
      .from('quiz_tournaments')
      .select('id, status, ends_at')
      .eq('id', tournament_id)
      .single()
    if (!tournament || tournament.status !== 'active') {
      return NextResponse.json({ error: 'Tournament is not currently active' }, { status: 400 })
    }
    // Check not already participated
    const { data: existing } = await admin
      .from('quiz_tournament_participants')
      .select('user_id')
      .eq('tournament_id', tournament_id)
      .eq('user_id', user.id)
      .single()
    if (existing) {
      return NextResponse.json({ error: 'You have already participated in this tournament' }, { status: 409 })
    }
  }

  // Check for existing active session in same category (anti-spam)
  const { data: activeSession } = await admin
    .from('quiz_sessions')
    .select('id, expires_at')
    .eq('user_id', user.id)
    .eq('category_id', category_id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (activeSession) {
    return NextResponse.json({ error: 'You already have an active session in this category. Complete it first.', session_id: activeSession.id }, { status: 409 })
  }

  // Fetch randomised questions for this session
  const { data: questions, error: qErr } = await admin
    .from('quiz_questions')
    .select('id, question, option_a, option_b, option_c, option_d, difficulty, points_value, time_limit_secs')
    .eq('category_id', category_id)
    .eq('is_active', true)
    .order('created_at') // deterministic base order before we shuffle server-side
    .limit(question_count * 3) // over-fetch for shuffling

  if (qErr || !questions || questions.length < 5) {
    return NextResponse.json({ error: 'Not enough questions available in this category' }, { status: 503 })
  }

  // Server-side Fisher-Yates shuffle (never trust client shuffle)
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, question_count)

  // Create session
  const { data: session, error: sessionErr } = await admin
    .from('quiz_sessions')
    .insert({
      user_id: user.id,
      category_id,
      tournament_id: tournament_id ?? null,
      questions_total: shuffled.length,
      status: 'active',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    })
    .select()
    .single()

  if (sessionErr || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // Store question order as metadata (so we can validate answers in order server-side)
  await admin
    .from('quiz_sessions')
    .update({ metadata: { question_ids: shuffled.map((q: { id: string }) => q.id) } })
    .eq('id', session.id)

  // If tournament, add participant record
  if (tournament_id) {
    await admin
      .from('quiz_tournament_participants')
      .upsert({ tournament_id, user_id: user.id, session_id: session.id, entry_paid: false })
  }

  // Return session info + first question (correct_answer NOT included)
  return NextResponse.json({
    session_id: session.id,
    category: { id: category.id, name: category.name, difficulty_tier: category.difficulty_tier, prize_pool_cents: category.prize_pool_cents },
    questions_total: shuffled.length,
    first_question: shuffled[0],
    question_index: 0,
  }, { status: 201 })
}
