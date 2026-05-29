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
  size = 22,
  color = 'currentColor',
}: {
  iconKey: string
  size?: number
  color?: string
}) {
  const Icon = ICONS[iconKey] ?? Layout
  return <Icon size={size} color={color} aria-hidden />
}
