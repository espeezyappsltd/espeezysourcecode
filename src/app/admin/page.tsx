'use client'

import { useAdminDashboard } from '../../components/admin/useAdminDashboard'
import AdminVerificationGate from '../../components/admin/AdminVerificationGate'
import AdminDashboardHeader from '../../components/admin/AdminDashboardHeader'
import AdminMarketingPanel from '../../components/admin/AdminMarketingPanel'
import AdminLaunchCenter from '../../components/admin/AdminLaunchCenter'
import AdminAnalyticsGrid from '../../components/admin/AdminAnalyticsGrid'
import AdminUserOrchestrator from '../../components/admin/AdminUserOrchestrator'
import AdminLiveLogs from '../../components/admin/AdminLiveLogs'
import AgentControlCentre from '@/components/AgentControlCentre'
import AdminExtras from '@/components/AdminExtras'

export default function AdminDashboard() {
  const {
    isVerified,
    verificationCode,
    setVerificationCode,
    verifying,
    handleVerify,
    stats,
    recentUsers,
    loading,
    systemLogs,
    config,
    savingConfig,
    launchConfig,
    setLaunchConfig,
    preregCount,
    savingLaunchConfig,
    saveLaunchConfig,
    fetchAdminData,
    handleUserAction,
    updatePlatformConfig,
    handleLaunchStudio,
  } = useAdminDashboard()

  if (!isVerified) {
    return (
      <AdminVerificationGate
        verificationCode={verificationCode}
        onCodeChange={setVerificationCode}
        onSubmit={handleVerify}
        verifying={verifying}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

        <AdminDashboardHeader onRefresh={fetchAdminData} isRefreshing={loading} />

        <AdminMarketingPanel
          config={config}
          onConfigChange={() => { /* re-fetch happens after each write */ }}
          onUpdateConfig={updatePlatformConfig}
          saving={savingConfig}
        />

        <AdminLaunchCenter
          launchConfig={launchConfig}
          onConfigChange={(updates) => setLaunchConfig((prev: any) => ({ ...prev, ...updates }))}
          preregCount={preregCount}
          onSave={saveLaunchConfig}
          saving={savingLaunchConfig}
        />

        <div style={{ marginBottom: '3rem', padding: '2.5rem', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '32px' }}>
          <AgentControlCentre />
        </div>

        <div style={{ marginBottom: '3rem', padding: '2.5rem', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '32px' }}>
          <AdminExtras />
        </div>

        <AdminAnalyticsGrid stats={stats} />

        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem' }}>
          <AdminUserOrchestrator users={recentUsers} loading={loading} onUserAction={handleUserAction} />
          <AdminLiveLogs logs={systemLogs} onLaunchStudio={handleLaunchStudio} />
        </div>

      </div>
    </div>
  )
}
