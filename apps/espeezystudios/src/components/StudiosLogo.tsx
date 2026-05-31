'use client'

import EspeezyAppLogo, { type EspeezyAppLogoVariant } from '@shared/EspeezyAppLogo'
import type { SVGProps } from 'react'

export type StudiosLogoVariant = EspeezyAppLogoVariant

type StudiosLogoProps = Omit<SVGProps<SVGSVGElement>, 'app'> & {
  variant?: StudiosLogoVariant
  label?: string
}

/** @deprecated Prefer `@shared/EspeezyAppLogo` with app="studios" */
export default function StudiosLogo({ variant = 'nav', label, ...props }: StudiosLogoProps) {
  return <EspeezyAppLogo app="studios" variant={variant} label={label} {...props} />
}
