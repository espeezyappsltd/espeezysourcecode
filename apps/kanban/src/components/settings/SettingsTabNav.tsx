'use client'

import {
  Palette as PaletteIcon,
  Shield,
  ShieldAlert,
  Activity as PulseIcon,
  History,
  Mail,
  MessageSquare,
  User,
  Users,
  AlertTriangle,
  HardDrive,
} from 'lucide-react'
import { TabName } from '@/types/ui'
import type { SettingsPageViewModel } from './settings-types'

export function SettingsTabNav({ vm }: { vm: SettingsPageViewModel }) {
  const { activeTab, setActiveTab, isAdmin } = vm

  return (
    <div
      className="scroll-x-allowed"
      style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border)',
        marginBottom: '2.5rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginLeft: 'calc(var(--p-safe) * -1)',
        marginRight: 'calc(var(--p-safe) * -1)',
        paddingLeft: 'var(--p-safe)',
        paddingRight: 'var(--p-safe)',
        scrollbarWidth: 'none',
      }}
    >
      {[
        { id: 'identity', label: 'Personal Identity', icon: User },
        { id: 'identity_hub', label: 'Identity Hub', icon: ShieldAlert },
        { id: 'pulse', label: 'Presence', icon: PulseIcon },
        { id: 'activity', label: 'Activity Log', icon: History },
        { id: 'intercom', label: 'Mail', icon: Mail },
        { id: 'workspace', label: 'Teams', icon: Users },
        { id: 'appearance', label: 'Design', icon: PaletteIcon },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'storage', label: 'Storage Node', icon: HardDrive },
        { id: 'data', label: 'Privacy', icon: AlertTriangle },
        { id: 'support', label: 'Feedback', icon: MessageSquare },
      ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabName)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: activeTab === tab.id ? 'var(--brand)' : 'var(--bg-sub)',
              color: activeTab === tab.id ? 'white' : 'var(--text-sub)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
    </div>
  )
}
