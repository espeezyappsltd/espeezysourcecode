/**
 * Product positioning: Espeezy is operated by a dedicated platform team (not a solo build).
 * Use these strings on pricing, checkout, billing, and upgrade surfaces.
 */

export const PLATFORM_TEAM_SIZE = 12

export const PLATFORM_OPERATIONS_TAGLINE =
  'Operated by a 12-member platform team running production backend, billing, and reliability.'

export const PRICING_INTRO =
  'Espeezy is built for student teams and operated by our platform crew—keeping collaboration infrastructure fast, secure, and affordable at scale.'

export const UPGRADE_HERO_TITLE = 'Support the platform to reach more schools'

export const UPGRADE_HERO_BODY =
  'A 12-member operations team runs Espeezy’s backend, payments, and campus rollout. Your upgrade funds servers, support, and the features on our roadmap.'

export const CHECKOUT_TEAM_NOTE =
  'Payments are processed securely by Stripe. Subscriptions are managed by the Espeezy platform team (12 engineers & operators on backend, billing, and support).'

export const LIFETIME_PLAN_NAME = 'Lifetime Scholar'

export const LIFETIME_PLAN_BADGE = 'Limited lifetime seats'

export const LIFETIME_PLAN_DESCRIPTION =
  'One-time access for a limited cohort of 100 lifetime seats. No monthly fees—all future Premium features included as we ship them.'

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

export const STRIPE_LIFETIME_LABEL = 'Lifetime Scholar — GBP 149 (one-time)'

export const BILLING_PANEL_SUBTITLE =
  'View your current plan and usage here. Subscribe or change tiers on espeezy.com—billing is handled by our platform team via Stripe.'

export const CHECKOUT_SUCCESS_TEAM_NOTE =
  'Thank you for supporting campus collaboration. Our platform team has activated your plan—reach support@espeezy.com if anything looks off.'

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
  'Espeezy documents real contribution in group projects. A 12-member platform team runs production backend, billing, and campus rollout—not a solo side project.'

export const FOOTER_TECH_BLURB =
  'Built on Next.js and Supabase. Integrates with Canvas, Blackboard, and Moodle. Payments via Stripe; subscriptions managed by our platform team.'

export const FOOTER_IMPORTANT_INFO = `Support: support@espeezy.com
Payments via Stripe · Managed by the Espeezy platform team (${PLATFORM_TEAM_SIZE} operators on backend, billing, and support).
Core student tier stays free.`

export const FOOTER_COPYRIGHT_TAGLINE =
  'Operated by a 12-member platform team for students everywhere.'

export const FOOTER_BOTTOM_RIGHT =
  'Free forever for students · No data sold · Team-run roadmap'

export const GAMES_LANDING_CTA_BODY =
  'Join the campus launch cohort on Espeezy. Our 12-person platform team runs the backend—be first to play when Games launches.'

export const GAMES_UPGRADE_GATE_NOTE =
  'Plans and billing are managed by the Espeezy platform team via Stripe.'

export const APP_FOOTER_TAGLINE_GAMES =
  'Espeezy Games · Learn through play · Team-operated platform'

export const APP_FOOTER_TAGLINE_DASHBOARD =
  'Espeezy Dashboard · Collaboration infrastructure · Team-operated platform'

export const SIDEBAR_UPGRADE_BLURB =
  'Support the platform team—unlock advanced themes and priority features.'
