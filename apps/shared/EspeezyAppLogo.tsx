'use client'

import type { SVGProps } from 'react'
import { useId } from 'react'
import {
  ESPEEZY_APP_LOGO_CONFIG,
  type EspeezyAppLogoSlug,
} from './espeezy-app-logo-config'
import './espeezy-app-logo.css'

export type EspeezyAppLogoVariant = 'nav' | 'hero' | 'footer' | 'login' | 'mark' | 'inline'

export type EspeezyAppLogoProps = SVGProps<SVGSVGElement> & {
  app: EspeezyAppLogoSlug
  variant?: EspeezyAppLogoVariant
  /** Override accessible label */
  label?: string
  /** Hide ESPEEZY eyebrow (word-only apps like marketing) */
  hideEyebrow?: boolean
}

const variantClass: Record<EspeezyAppLogoVariant, string> = {
  nav: 'espeezy-app-logo espeezy-app-logo--nav',
  hero: 'espeezy-app-logo espeezy-app-logo--hero',
  footer: 'espeezy-app-logo espeezy-app-logo--footer',
  login: 'espeezy-app-logo espeezy-app-logo--login',
  mark: 'espeezy-app-logo espeezy-app-logo--mark',
  inline: 'espeezy-app-logo espeezy-app-logo--inline',
}

export { type EspeezyAppLogoSlug, isEspeezyAppLogoSlug, platformSlugToLogoSlug, ESPEEZY_APP_MARK_ICON_PATH } from './espeezy-app-logo-config'

export default function EspeezyAppLogo({
  app,
  variant = 'nav',
  label,
  hideEyebrow = false,
  className,
  ...props
}: EspeezyAppLogoProps) {
  const config = ESPEEZY_APP_LOGO_CONFIG[app]
  const classes = [variantClass[variant], className].filter(Boolean).join(' ')
  const uid = useId().replace(/:/g, '')
  const gradId = `espeezy-logo-grad-${uid}`
  const gradSoftId = `espeezy-logo-grad-soft-${uid}`
  const glowId = `espeezy-logo-glow-${uid}`
  const ariaLabel = label ?? config.label
  const showEyebrow = !hideEyebrow && app !== 'marketing' && app !== 'platform'
  const wordClass =
    config.word.length > 8 ? 'espeezy-app-logo__word espeezy-app-logo__word--compact' : 'espeezy-app-logo__word'

  if (variant === 'mark') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        role="img"
        aria-label={ariaLabel}
        className={classes}
        {...props}
      >
        <title>{ariaLabel}</title>
        <LogoDefs gradId={gradId} gradSoftId={gradSoftId} glowId={glowId} />
        <LogoMark gradId={gradId} gradSoftId={gradSoftId} glowId={glowId} />
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 40"
      role="img"
      aria-label={ariaLabel}
      className={classes}
      {...props}
    >
      <title>{ariaLabel}</title>
      <LogoDefs gradId={gradId} gradSoftId={gradSoftId} glowId={glowId} />
      <g transform="translate(2 4)">
        <LogoMark gradId={gradId} gradSoftId={gradSoftId} glowId={glowId} />
      </g>
      <g className="espeezy-app-logo__type">
        {showEyebrow ? (
          <text x="44" y="13" className="espeezy-app-logo__eyebrow" fill="currentColor">
            ESPEEZY
          </text>
        ) : null}
        <text x="44" y={showEyebrow ? 30 : 24} className={wordClass} fill="currentColor">
          {config.word}
        </text>
        <rect
          x="44"
          y={showEyebrow ? 34 : 28}
          width={config.ruleWidth}
          height="1.5"
          rx="0.75"
          fill={`url(#${gradId})`}
        />
      </g>
    </svg>
  )
}

function LogoDefs({
  gradId,
  gradSoftId,
  glowId,
}: {
  gradId: string
  gradSoftId: string
  glowId: string
}) {
  return (
    <defs>
      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--brand, var(--studios-brand, #818cf8))" />
        <stop offset="55%" stopColor="var(--accent, var(--studios-accent, #22d3ee))" />
        <stop offset="100%" stopColor="var(--brand, var(--studios-brand, #818cf8))" />
      </linearGradient>
      <linearGradient id={gradSoftId} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--brand, var(--studios-brand, #818cf8))" stopOpacity="0.15" />
        <stop offset="100%" stopColor="var(--accent, var(--studios-accent, #22d3ee))" stopOpacity="0.35" />
      </linearGradient>
      <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

function LogoMark({
  gradId,
  gradSoftId,
  glowId,
}: {
  gradId: string
  gradSoftId: string
  glowId: string
}) {
  return (
    <>
      <circle cx="16" cy="16" r="15" fill={`url(#${gradSoftId})`} />
      <circle
        cx="16"
        cy="16"
        r="14.25"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.25"
        filter={`url(#${glowId})`}
      />
      <path d="M16 6.5 L19.2 14.8 L16 16 Z" fill={`url(#${gradId})`} opacity="0.95" />
      <path d="M25.5 16 L17.2 19.2 L16 16 Z" fill={`url(#${gradId})`} opacity="0.82" />
      <path d="M16 25.5 L12.8 17.2 L16 16 Z" fill={`url(#${gradId})`} opacity="0.88" />
      <path d="M6.5 16 L14.8 12.8 L16 16 Z" fill={`url(#${gradId})`} opacity="0.76" />
      <path d="M22.8 9.2 L18.8 17.2 L16 16 Z" fill={`url(#${gradId})`} opacity="0.68" />
      <path d="M22.8 22.8 L14.8 18.8 L16 16 Z" fill={`url(#${gradId})`} opacity="0.72" />
      <path d="M9.2 22.8 L13.2 14.8 L16 16 Z" fill={`url(#${gradId})`} opacity="0.64" />
      <path d="M9.2 9.2 L17.2 13.2 L16 16 Z" fill={`url(#${gradId})`} opacity="0.58" />
      <circle
        cx="16"
        cy="16"
        r="2.35"
        fill="var(--bg-sub, var(--studios-surface-2, #1a2336))"
        stroke={`url(#${gradId})`}
        strokeWidth="0.75"
      />
      <circle cx="16" cy="16" r="0.85" fill={`url(#${gradId})`} />
    </>
  )
}
