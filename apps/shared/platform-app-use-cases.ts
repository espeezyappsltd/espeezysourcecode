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
    audience: 'Students in group projects',
    scenarios: [
      'Split coursework into tasks the whole team can see',
      'Show your tutor who did what before grades go in',
      'Keep one shared board for your module or capstone team',
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
    audience: 'Students and freelancers doing client work',
    scenarios: [
      'Track a client project from brief to final delivery',
      'Send invoices and project files when the work is done',
      'Keep paid gigs separate from your study boards',
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
