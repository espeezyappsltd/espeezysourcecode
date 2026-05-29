/**
 * Product positioning: Espeezy is operated by a dedicated platform team (not a solo build).
 * Use these strings on pricing, checkout, billing, and upgrade surfaces.
 */

import { ESPEEZY_APP_ORIGINS } from './app-url'

/** Primary workspace — sign up, onboarding, and daily collaboration. */
export const MAIN_APP_ORIGIN = ESPEEZY_APP_ORIGINS.kanban

export const MAIN_APP_HOST_LABEL = 'kanban.espeezy.com'

export const GETTING_STARTED_STEP_1_TITLE = 'Get Started'

export const GETTING_STARTED_STEP_1_DESC = `Sign up at ${MAIN_APP_HOST_LABEL}, the main Espeezy app. It takes under 20 seconds.`

export const GETTING_STARTED_ACCOUNT_BODY = `Head to ${MAIN_APP_HOST_LABEL} and sign up with your University email. No Uni? No problem! You can still use the app with a personal email.`

export const INSTALLATION_WEB_BODY = `The Espeezy collaborative apps run entirely in your browser. Open ${MAIN_APP_HOST_LABEL} on any device with a modern browser. Sign in and you are ready.`

export const PLATFORM_TEAM_SIZE = 12

export const PLATFORM_OPERATIONS_TAGLINE = 'Built and run by a 12-person team.'

/**
 * One-sentence pitch. Leads with what it is, the problem, and who it's for —
 * no jargon. Reuse this verbatim across hero, metadata, and social cards.
 */
export const PLATFORM_ONE_LINER =
  'Espeezy is a group-project workspace that records who did what, so every student gets credit for their work.'

/** Prereg/kanban hero: headline + supporting sentence. */
export const HERO_COPY_LINES = [
  'Group projects, with proof of who did the work.',
  'Plan tasks on a shared board, track every contribution automatically, and export a record you can show graders, recruiters, and teammates.',
] as const

export const HERO_ANALYTICS_CAPTION = 'See it in action'

/** @deprecated Use HERO_COPY_LINES[1] */
export const HERO_ANALYTICS_TAGLINE = HERO_COPY_LINES[1]

export const KANBAN_DEMO_LABEL = 'Get a first look at the Kanban Dashboard'
export const KANBAN_DEMO_PATH = '/demo'

export const PRICING_INTRO =
  'Espeezy learning apps are built for all types of teams and projects, keeping collaboration fast, secure, and affordable at scale. All core features are free for students.'

export const UPGRADE_HERO_TITLE = 'More for your team, when you need it'

export const UPGRADE_HERO_BODY =
  'A 12-member team runs Espeezy’s backend, payments, and campus rollouts. Your upgrade funds servers, support, and the features on our roadmap. All core features are free for students.'

export const CHECKOUT_TEAM_NOTE =
  'Payments are processed securely by Stripe. Subscriptions are managed by the Espeezy team.'

export const LIFETIME_PLAN_NAME = 'Lifetime Scholar'

export const LIFETIME_PLAN_BADGE = 'Limited lifetime seats'

export const LIFETIME_PLAN_DESCRIPTION =
  'One-time access for a limited cohort of 100 lifetime seats. No monthly fees; all future Premium features included as we ship them.'

export const LIFETIME_FEATURES = [
  'Permanent Premium access',
  'Lifetime Scholar badge on your profile',
  'All future Premium features included',
  'Beta access as new modules launch',
  'Priority platform support lane',
  'Legacy pricing locked in forever',
] as const

export const LIFETIME_CTA_AVAILABLE = 'Claim lifetime seat'

export const LIFETIME_CTA_SOLD_OUT = 'Lifetime seats sold out'

export const LIFETIME_SCARCITY_LABEL = (left: number) =>
  left <= 0 ? 'Sold out' : `Only ${left} lifetime seat${left === 1 ? '' : 's'} left`

export const STRIPE_LIFETIME_LABEL = 'Lifetime Scholar · GBP 149 (one-time)'

export const BILLING_PANEL_SUBTITLE =
  'View your current plan and usage here. Subscribe or change tiers on espeezy.com; billing is handled by our platform team via Stripe.'

export const CHECKOUT_SUCCESS_TEAM_NOTE =
  'Thank you for supporting campus collaboration. Our platform team has activated your plan. Reach support@espeezy.com if anything looks off.'

export const PREREG_LIFETIME_FEATURES = [
  'Everything in Premium, forever',
  'Lifetime Scholar badge',
  'All future platform updates included',
  'Beta access as features ship',
  'Legacy pricing protection',
  'Priority support from the platform team',
] as const

/** Site-wide footer and lightweight app footers */
export const FOOTER_BRAND_BLURB =
  'The Espeezy kanban dashboard documents real contribution in group projects. A 12-member platform team runs production backend, billing, and campus rollouts.'

export const FOOTER_TECH_BLURB =
  'Built on Next.js and Supabase. Integrates with Canvas, Blackboard, and Moodle. Payments via Stripe; subscriptions managed by our platform team.'

/** Business contact phone — display format and E.164 tel: link. */
export const SUPPORT_PHONE = '01604 969068'
export const SUPPORT_PHONE_TEL = '+441604969068'

export const FOOTER_IMPORTANT_INFO = `Support: support@espeezy.com · Tel: ${SUPPORT_PHONE}
Payments via Stripe · Managed by the Espeezy platform team (${PLATFORM_TEAM_SIZE} operators on backend, billing, and support).
Core student tier stays free.`

export const FOOTER_COPYRIGHT_TAGLINE =
  'Operated by a 12-member platform team for students everywhere.'

export const FOOTER_BOTTOM_RIGHT =
  'Free forever for students · No data sold · Team-run roadmap'

export const GAMES_LANDING_CTA_BODY =
  'Join the campus launch cohort on Espeezy. Our 12-person platform team runs the backend; be first to play when Games launches.'

export const GAMES_UPGRADE_GATE_NOTE =
  'Plans and billing are managed by the Espeezy platform team via Stripe.'

export const APP_FOOTER_TAGLINE_GAMES =
  'Espeezy Games · Learn through play · Team-operated platform'

export const APP_FOOTER_TAGLINE_DASHBOARD =
  'Espeezy Dashboard · Collaboration infrastructure · Team-operated platform'

export const SIDEBAR_UPGRADE_BLURB =
  'Support the platform team and unlock advanced themes and priority features.'

export {
  REFERRAL_PRO_DISCOUNT_PERCENT,
  REFERRAL_PRO_MAX_REDEMPTIONS,
  REFERRAL_PROMO_HEADLINE,
  REFERRAL_PROMO_TERMS,
} from './referrals-constants'
