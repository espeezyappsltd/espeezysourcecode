import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase/admin'
import { avatarUrlForProfile } from '@/lib/platform/contact-rules'

export const dynamic = 'force-dynamic'

const DEMO_POSTS = [
  {
    post_type: 'milestone',
    content:
      'Just shipped our capstone MVP — real-time collab on Espeezy Kanban. Demo day in 12 days. Who else is presenting this term?',
  },
  {
    post_type: 'achievement',
    content:
      'Passed AWS Cloud Practitioner on the first attempt. Study group notes are in our group vault if anyone wants them.',
  },
  {
    post_type: 'project',
    content:
      'Looking for a UX reviewer for our accessibility audit (WCAG 2.2). 30 min async walkthrough — drop a comment if interested.',
  },
  {
    post_type: 'general',
    content:
      'Library level 3 is unreal quiet after 8pm. Perfect for deep work before finals week.',
  },
  {
    post_type: 'milestone',
    content:
      'Published our first marketplace listing — graphing calculator, 15 credits. Campus pickup only.',
  },
  {
    post_type: 'achievement',
    content:
      'Mentored two first-years through their first sprint. Proud of how fast they picked up code review etiquette.',
  },
]

const DEMO_HUSTLE = [
  {
    title: 'Figma prototype for student dashboard',
    description: 'Need 6–8 screens, mobile-first. Brand tokens provided. Due in 10 days.',
    category: 'design',
    payout_cents: 4500,
  },
  {
    title: 'Python data cleaning script',
    description: 'CSV merge + simple charts for lab report. ~3 hours of work.',
    category: 'coding',
    payout_cents: 3500,
  },
  {
    title: 'Calculus II tutoring (2 sessions)',
    description: 'Integration techniques review before midterm. Online or library.',
    category: 'tutoring',
    payout_cents: 5000,
  },
  {
    title: 'Blog post — sustainability in campus labs',
    description: '800 words, citations required. Tone: academic but readable.',
    category: 'writing',
    payout_cents: 2800,
  },
  {
    title: 'Short promo video for hackathon',
    description: '30–45 sec vertical reel. Footage provided.',
    category: 'video',
    payout_cents: 6000,
  },
  {
    title: 'Literature review — HCI groupware',
    description: 'Find 8–10 recent papers, annotate key findings.',
    category: 'research',
    payout_cents: 4000,
  },
]

function authorized(req: Request): boolean {
  const secret = process.env.SEED_SECRET
  if (secret && req.headers.get('x-seed-secret') === secret) return true
  return process.env.NODE_ENV === 'development'
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminDb()
  const summary: Record<string, number | string> = {}

  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .limit(12)

  if (!profiles?.length) {
    return NextResponse.json({ error: 'No profiles found to seed against.' }, { status: 400 })
  }

  let avatarsUpdated = 0
  for (const p of profiles) {
    if (!p.avatar_url?.trim()) {
      const { error } = await db
        .from('profiles')
        .update({ avatar_url: avatarUrlForProfile(p) })
        .eq('id', p.id)
      if (!error) avatarsUpdated += 1
    }
  }
  summary.avatarsUpdated = avatarsUpdated

  const { count: postCount } = await db
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false)

  let postsCreated = 0
  if ((postCount ?? 0) < 4) {
    for (let i = 0; i < DEMO_POSTS.length; i++) {
      const author = profiles[i % profiles.length]
      const demo = DEMO_POSTS[i]
      const daysAgo = i * 3600 * 6
      const created_at = new Date(Date.now() - daysAgo * 1000).toISOString()

      const { data: post, error } = await db
        .from('posts')
        .insert({
          author_id: author.id,
          content: demo.content,
          post_type: demo.post_type,
          visibility: 'public',
          media_urls: [],
          is_deleted: false,
          created_at,
        })
        .select('id')
        .single()

      if (error || !post) continue
      postsCreated += 1

      const reactor = profiles[(i + 1) % profiles.length]
      if (reactor.id !== author.id) {
        await db.from('post_reactions').insert({
          post_id: post.id,
          user_id: reactor.id,
          reaction: i % 2 === 0 ? 'like' : 'fire',
        })
      }

      if (i < 3) {
        const commenter = profiles[(i + 2) % profiles.length]
        await db.from('post_comments').insert({
          post_id: post.id,
          author_id: commenter.id,
          content: 'This is great — thanks for sharing on Academic Journeys!',
        })
      }
    }
  }
  summary.postsCreated = postsCreated

  const { count: hustleCount } = await db
    .from('hustle_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')

  let hustleCreated = 0
  if ((hustleCount ?? 0) < 4) {
    for (let i = 0; i < DEMO_HUSTLE.length; i++) {
      const poster = profiles[i % profiles.length]
      const task = DEMO_HUSTLE[i]
      const payoutCredits = Math.min(100, Math.max(1, Math.round(task.payout_cents / 50)))
      const { error } = await db.from('hustle_tasks').insert({
        poster_id: poster.id,
        title: task.title,
        description: task.description,
        category: task.category,
        payout_credits: payoutCredits,
        payout_cents: task.payout_cents,
        escrow_credits: i % 2 === 0 ? payoutCredits : 0,
        status: 'open',
        connection_only: false,
        created_at: new Date(Date.now() - i * 7200000).toISOString(),
      })
      if (!error) hustleCreated += 1
    }
  }
  summary.hustleTasksCreated = hustleCreated

  try {
    const { seedOnboardingForAllUsers } = await import('@/lib/onboarding/onboarding-service')
    const onboarding = await seedOnboardingForAllUsers()
    summary.onboardingUsers = onboarding.users
    summary.onboardingTasksCreated = onboarding.tasksCreated
  } catch (err) {
    summary.onboardingError = err instanceof Error ? err.message : 'onboarding seed failed'
  }

  return NextResponse.json({ ok: true, summary })
}
