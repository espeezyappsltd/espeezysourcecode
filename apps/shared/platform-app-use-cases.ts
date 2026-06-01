/**
 * Plain-language use cases per platform app (marketing landing + product pages).
 * Written in universal, informative language — no region-specific terms.
 */

export type PlatformAppUseCase = {
  /** Who this app is for — one short phrase */
  audience: string
  /** 2–3 real situations anyone can relate to */
  scenarios: string[]
}

export const PLATFORM_APP_USE_CASES: Record<string, PlatformAppUseCase> = {
  kanban: {
    audience: 'University and college students, anywhere',
    scenarios: [
      'Break a group assignment into tasks everyone can see and update',
      'Show your professor or TA who handled what before the deadline',
      'Keep one board for a course project, club, or study group',
    ],
  },
  games: {
    audience: 'Students and study groups, anywhere',
    scenarios: [
      'Quiz each other on lecture notes and readings before an exam',
      'Run short competitive rounds with classmates online or in person',
      'Use the same Espeezy login as Kanban, one account across apps',
    ],
  },
  admin: {
    audience: 'Administrators running an Espeezy deployment',
    scenarios: [
      'Control who can access admin tools on your instance',
      'Update public pages, pricing, and launch copy from one console',
      'Review signups and support requests without editing code',
    ],
  },
  prereg: {
    audience: 'Teams launching Espeezy to their audience',
    scenarios: [
      'Collect early-access emails before you go live',
      'Share pricing, docs, and app links from one public site',
      'Help visitors find the right Espeezy app for their need',
    ],
  },
  core: {
    audience: 'Developers and technical teams',
    scenarios: [
      'Self-host any Espeezy app on Cloudflare or your own infrastructure',
      'Follow setup docs and open live app links from one hub',
      'Connect Supabase, domains, and branding step by step',
    ],
  },
  studios: {
    audience: 'Freelancers and side-hustle builders',
    scenarios: [
      'Run a client job from first brief to final handoff in one place',
      'Send invoices and deliverables when the work is done and get paid faster',
      'Keep freelance gigs separate from your school boards on Kanban',
    ],
  },
  articles: {
    audience: 'Writers, creators, and student publications',
    scenarios: [
      'Publish news, essays, and project write-ups online',
      'Share long-form posts on blog.espeezy.com or articles.espeezy.com',
      'Reach readers who already use other Espeezy apps',
    ],
  },
}

export function getPlatformAppUseCases(slug: string): PlatformAppUseCase | null {
  return PLATFORM_APP_USE_CASES[slug] ?? null
}
