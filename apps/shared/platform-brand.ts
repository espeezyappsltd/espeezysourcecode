/**
 * Product positioning and user-facing copy for Espeezy apps.
 * Language is professional, educative, and globally accessible.
 */

import { buildAppUrl, ESPEEZY_APP_ORIGINS } from './app-url'

export {
  COPYRIGHT_HOLDER,
  COPYRIGHT_STUDIOS_PRODUCT,
  FOOTER_COPYRIGHT_TAGLINE,
  FOOTER_LEGAL_LINKS,
  FOOTER_RIGHTS_RESERVED,
  FOOTER_TRADEMARK_NOTICE,
  formatCopyrightNotice,
  formatCopyrightNoticeShort,
} from './platform-legal'

/** Primary workspace — sign up, onboarding, and daily collaboration. */
export const MAIN_APP_ORIGIN = ESPEEZY_APP_ORIGINS.kanban

export const MAIN_APP_HOST_LABEL = 'kanban.espeezy.com'

export const GETTING_STARTED_STEP_1_TITLE = 'Create your account'

export const GETTING_STARTED_STEP_1_DESC = `Register at ${MAIN_APP_HOST_LABEL}. Account setup takes under one minute.`

export const GETTING_STARTED_ACCOUNT_BODY = `Create an account at ${MAIN_APP_HOST_LABEL} using your university or college email. You may also register with a personal email address if your institution does not provide one.`

export const INSTALLATION_WEB_BODY = `Espeezy collaborative applications run in your web browser. Open ${MAIN_APP_HOST_LABEL} on any device with a modern browser, sign in, and begin working with your team.`

export const PLATFORM_TEAM_SIZE = 12

export const PLATFORM_OPERATIONS_TAGLINE = 'Operated by a dedicated platform team.'

/**
 * One-sentence pitch for metadata, hero sections, and social cards.
 */
export const PLATFORM_ONE_LINER =
  'Espeezy learning apps are built for students and teams: shared boards, study tools, client delivery, and publishing, with a clear record of who contributed what.'

/** Marketing hero: headline and supporting sentence. */
export const HERO_COPY_LINES = [
  'Espeezy learning apps',
  'Group boards, study tools, and client delivery. One login across the apps below.',
] as const

export const HERO_ANALYTICS_CAPTION = 'Product overview'

/** @deprecated Use HERO_COPY_LINES[1] */
export const HERO_ANALYTICS_TAGLINE = HERO_COPY_LINES[1]

export const KANBAN_DEMO_LABEL = 'Preview the Kanban workspace'
export const KANBAN_DEMO_PATH = '/demo'
export const KANBAN_DEMO_URL = buildAppUrl('kanban', KANBAN_DEMO_PATH)
export const KANBAN_SIGNUP_PATH = '/login?signup=true'
export const KANBAN_SIGNUP_URL = buildAppUrl('kanban', KANBAN_SIGNUP_PATH)

export const PRICING_INTRO =
  'Espeezy learning applications are designed for academic and professional teams. Core collaboration features remain free for verified students.'

export const UPGRADE_HERO_TITLE = 'Advanced capabilities for growing teams'

export const UPGRADE_HERO_BODY =
  'A dedicated platform team operates Espeezy’s backend, payments, and deployments. Your subscription supports infrastructure, customer support, and the product roadmap. Core features remain free for students.'

export const CHECKOUT_TEAM_NOTE =
  'Payments are processed securely by Stripe. Subscriptions are managed by the Espeezy platform team.'

export const CHECKOUT_TRUST_LINE =
  'Used by student teams at universities and colleges worldwide.'

export const LIFETIME_PLAN_NAME = 'Lifetime Scholar'

export const LIFETIME_PLAN_BADGE = 'Limited lifetime seats'

export const LIFETIME_PLAN_DESCRIPTION =
  'One-time access for a limited cohort of 100 lifetime seats. No recurring fees; Premium features included as they are released.'

export const LIFETIME_FEATURES = [
  'Permanent Premium access',
  'Lifetime Scholar badge on your profile',
  'All future Premium features included',
  'Early access to new modules',
  'Priority platform support',
  'Legacy pricing locked in permanently',
] as const

export const LIFETIME_CTA_AVAILABLE = 'Claim lifetime seat'

export const LIFETIME_CTA_SOLD_OUT = 'Lifetime seats sold out'

export const LIFETIME_SCARCITY_LABEL = (left: number) =>
  left <= 0 ? 'Sold out' : `Only ${left} lifetime seat${left === 1 ? '' : 's'} remaining`

export const STRIPE_LIFETIME_LABEL = 'Lifetime Scholar · £149 (one-time)'

export const BILLING_PANEL_SUBTITLE =
  'Review your current plan and usage. Subscribe or change tiers at espeezy.com; billing is managed by the Espeezy platform team through Stripe.'

export const CHECKOUT_SUCCESS_TEAM_NOTE =
  'Thank you for supporting collaborative learning. The platform team has activated your plan. Contact support@espeezy.com if you need assistance.'

export const PREREG_LIFETIME_FEATURES = [
  'Everything in Premium, permanently',
  'Lifetime Scholar badge',
  'All future platform updates included',
  'Early access as features are released',
  'Legacy pricing protection',
  'Priority support from the platform team',
] as const

/** Site-wide footer brand and support information */
export const FOOTER_BRAND_BLURB =
  'Espeezy learning apps for students and teams. Core collaboration stays free for verified students.'

/** Business contact phone — display format and E.164 tel: link. */
export const SUPPORT_PHONE = '01604 969068'
export const SUPPORT_PHONE_TEL = '+441604969068'

export const FOOTER_SUPPORT_LINE = `support@espeezy.com · ${SUPPORT_PHONE}`

/** @deprecated Prefer FOOTER_SUPPORT_LINE on marketing footers. */
export const FOOTER_TECH_BLURB = 'Payments via Stripe. Built on Next.js and Supabase.'

/** @deprecated Prefer FOOTER_SUPPORT_LINE on marketing footers. */
export const FOOTER_IMPORTANT_INFO = FOOTER_SUPPORT_LINE

export const FOOTER_BOTTOM_RIGHT =
  'Free for students · Privacy-first · Transparent roadmap'

export const GAMES_LANDING_CTA_BODY =
  'Register for early access to Espeezy Games. The platform team operates the backend; you will receive launch updates as features become available.'

export const GAMES_UPGRADE_GATE_NOTE =
  'Plans and billing are managed by the Espeezy platform team through Stripe.'

export const APP_FOOTER_TAGLINE_GAMES =
  'Espeezy Games · Structured learning through interactive study sessions'

export const APP_FOOTER_TAGLINE_DASHBOARD =
  'Espeezy Dashboard · Developer and deployment tools for the Espeezy platform'

export const SIDEBAR_UPGRADE_BLURB =
  'Support platform development and unlock advanced themes and priority capabilities.'

export const SIDEBAR_STUDIO_BLURB =
  'Premium unlocks Espeezy Studio: project hub, invoicing, and client delivery workflows.'

export {
  REFERRAL_PRO_DISCOUNT_PERCENT,
  REFERRAL_PRO_MAX_REDEMPTIONS,
  REFERRAL_PROMO_HEADLINE,
  REFERRAL_PROMO_TERMS,
} from './referrals-constants'
