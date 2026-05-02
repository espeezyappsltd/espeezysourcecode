import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

const StartSchema = z.object({
  categorySlug: z.string().min(2).max(80),
  questionCount: z.number().int().min(5).max(20).optional().default(10),
  guestName: z.string().min(2).max(40).optional(),
})

function makeAccessToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = StartSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 })
  }

  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))

  const admin = await createAdminClient()
  const { categorySlug, questionCount, guestName } = parsed.data

  const { data: category } = await admin
    .from('quiz_categories')
    .select('id, slug, name, difficulty_tier, prize_pool_cents, is_active')
    .eq('slug', categorySlug)
    .single()

  if (!category || !category.is_active) {
    return NextResponse.json({ error: 'Category not found or inactive' }, { status: 404 })
  }

  const { data: questions, error: qErr } = await admin
    .from('quiz_questions')
    .select('id, question, option_a, option_b, option_c, option_d, difficulty, points_value, time_limit_secs')
    .eq('category_id', category.id)
    .eq('is_active', true)
    .limit(questionCount * 3)

  if (qErr || !questions || questions.length < 5) {
    return NextResponse.json({ error: 'Not enough questions available in this category' }, { status: 503 })
  }

  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, questionCount)
  const questionIds = shuffled.map((q: { id: string }) => q.id)

  const playMode = user ? 'member' : 'guest'
  const accessToken = playMode === 'guest' ? makeAccessToken() : null

  const { data: session, error: sErr } = await admin
    .from('quiz_sessions')
    .insert({
      user_id: user?.id ?? null,
      category_id: category.id,
      status: 'active',
      questions_total: shuffled.length,
      play_mode: playMode,
      guest_display_name: playMode === 'guest' ? (guestName ?? 'Guest') : null,
      access_token: accessToken,
      metadata: { question_ids: questionIds },
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    .select('id, play_mode, guest_display_name, access_token, questions_total')
    .single()

  if (sErr || !session) {
    return NextResponse.json({ error: 'Failed to create game session' }, { status: 500 })
  }

  return NextResponse.json({
    sessionId: session.id,
    playMode: session.play_mode,
    accessToken: session.access_token,
    category: {
      slug: category.slug,
      name: category.name,
      difficulty: category.difficulty_tier,
      prizePoolCents: category.prize_pool_cents,
    },
    questionsTotal: session.questions_total,
    firstQuestion: shuffled[0],
    questionIndex: 0,
  }, { status: 201 })
}
