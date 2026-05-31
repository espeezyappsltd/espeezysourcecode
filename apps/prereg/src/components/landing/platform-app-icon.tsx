import {
  LayoutDashboard,
  Gamepad2,
  Shield,
  Globe,
  Cpu,
  Palette,
  Layout,
  type LucideIcon,
} from 'lucide-react'
import EspeezyAppLogo from '@shared/EspeezyAppLogo'
import { platformSlugToLogoSlug } from '@shared/espeezy-app-logo-config'

const ICONS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'gamepad-2': Gamepad2,
  gamepad2: Gamepad2,
  shield: Shield,
  globe: Globe,
  cpu: Cpu,
  palette: Palette,
  layout: Layout,
}

export function PlatformAppIcon({
  iconKey,
  appSlug,
  size = 22,
  color = 'currentColor',
}: {
  iconKey: string
  appSlug?: string
  size?: number
  color?: string
}) {
  const logoSlug = appSlug ? platformSlugToLogoSlug(appSlug) : null
  if (logoSlug) {
    return (
      <EspeezyAppLogo
        app={logoSlug}
        variant="mark"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  const Icon = ICONS[iconKey] ?? Layout
  return <Icon size={size} color={color} aria-hidden />
}
