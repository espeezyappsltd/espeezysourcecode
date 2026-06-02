'use client'

import EspeezyAppLogo from '@shared/EspeezyAppLogo'

type Props = {
  variant?: 'nav' | 'footer' | 'mark' | 'login'
}

/** Platform marketing wordmark (espeezy.com, footers, loading states). */
export default function EspeezyMarketingBrand({ variant = 'nav' }: Props) {
  return <EspeezyAppLogo app="marketing" variant={variant} />
}
