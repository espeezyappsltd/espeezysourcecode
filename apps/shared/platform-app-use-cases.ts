/**
 * Plain-language use cases per platform app (marketing landing + product pages).
 */

export type PlatformAppUseCase = {
  /** Who this app is for — one short phrase */
  audience: string
  /** 2–3 real situations, written for students and campus teams */
  scenarios: string[]
}

export const PLATFORM_APP_USE_CASES: Record<string, PlatformAppUseCase> = {
  kanban: {
    audience: 'University and college students, anywhere',
    scenarios: [
      'Break a group assignment into tasks everyone can see and update',
      'Show your professor or TA who handled what before the deadline',
      'Keep one board for your course project, club, or study group',
    ],
  },
  games: {
    audience: 'Study groups before exams',
    scenarios: [
      'Quiz each other on lecture topics in quick rounds',
      'Run friendly matches to see who knows the material',
      'Use the same Espeezy login as Kanban — no extra signup',
    ],
  },
  admin: {
    audience: 'Staff running campus rollouts',
    scenarios: [
      'Control who can access admin tools on your deployment',
      'Update launch copy and pricing from one console',
      'Review signups and support without digging through code',
    ],
  },
  prereg: {
    audience: 'Clubs and teams launching Espeezy',
    scenarios: [
      'Collect early-access emails before you go live',
      'Share pricing, docs, and app links from one site',
      'Give new students a clear path to the right app',
    ],
  },
  core: {
    audience: 'Developers and IT teams',
    scenarios: [
      'Self-host any Espeezy app on Cloudflare or your own server',
      'Jump between setup docs and live app links in one place',
      'Connect Supabase and your branding step by step',
    ],
  },
  studios: {
    audience: 'Freelancers and side-hustle builders',
    scenarios: [
      'Run a client job from first brief to final handoff in one place',
      'Send invoices and deliverables when the work is done — get paid faster',
      'Keep freelance gigs separate from your school boards on Kanban',
    ],
  },
  articles: {
    audience: 'Writers and campus media',
    scenarios: [
      'Publish society news or module write-ups online',
      'Share longer reads on blog.espeezy.com',
      'Reach readers who already use Espeezy apps',
    ],
  },
}

export function getPlatformAppUseCases(slug: string): PlatformAppUseCase | null {
  return PLATFORM_APP_USE_CASES[slug] ?? null
}
