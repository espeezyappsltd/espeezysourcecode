'use client'

import { TabName } from '@/types/ui'
import type { SettingsPageViewModel } from './settings-types'
import { SettingsActivityPanel, SettingsIntercomPanel, SettingsPresencePanel } from './panels/SettingsEmbeddedPanels'
import { SettingsAppearancePanel } from './panels/SettingsAppearancePanel'
import { SettingsBillingPanel } from './panels/SettingsBillingPanel'
import { SettingsDataPanel } from './panels/SettingsDataPanel'
import { SettingsIdentityHubPanel } from './panels/SettingsIdentityHubPanel'
import { SettingsIdentityPanel } from './panels/SettingsIdentityPanel'
import { SettingsSecurityPanel } from './panels/SettingsSecurityPanel'
import { SettingsStoragePanel } from './panels/SettingsStoragePanel'
import { SettingsSupportPanel } from './panels/SettingsSupportPanel'
import { SettingsTeamPanel } from './panels/SettingsTeamPanel'
import { SettingsWorkspacePanel } from './panels/SettingsWorkspacePanel'

export function SettingsTabPanels({ vm }: { vm: SettingsPageViewModel }) {
  const { activeTab, profile, isAdmin } = vm

  return (
    <div style={{ minHeight: '400px' }}>
      {activeTab === 'support' && <SettingsSupportPanel vm={vm} />}

      {activeTab === ('storage' as TabName) && profile && <SettingsStoragePanel vm={vm} />}

      {activeTab === 'billing' && profile && <SettingsBillingPanel vm={vm} />}

      {activeTab === 'intercom' && profile && <SettingsIntercomPanel vm={vm} />}

      {activeTab === 'activity' && profile && <SettingsActivityPanel vm={vm} />}

      {activeTab === 'pulse' && profile?.group_id && <SettingsPresencePanel vm={vm} />}

      {activeTab === 'identity_hub' && <SettingsIdentityHubPanel vm={vm} />}

      {activeTab === 'identity' && <SettingsIdentityPanel vm={vm} />}

      {activeTab === 'team' && isAdmin && <SettingsTeamPanel vm={vm} />}

      {activeTab === 'workspace' && <SettingsWorkspacePanel vm={vm} />}

      {activeTab === 'appearance' && <SettingsAppearancePanel vm={vm} />}

      {activeTab === 'security' && <SettingsSecurityPanel vm={vm} />}

      {activeTab === 'data' && <SettingsDataPanel vm={vm} />}
    </div>
  )
}
