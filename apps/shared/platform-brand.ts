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
  'Manage your subscription and Espeezy credit wallet. Billing is handled by our platform team via Stripe.'

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
