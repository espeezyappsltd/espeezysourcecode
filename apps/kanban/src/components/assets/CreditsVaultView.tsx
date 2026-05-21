'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Coins, Loader2 } from 'lucide-react'
import { formatCreditCapHint, formatCredits, formatGbpApprox } from '@/lib/credits'
import { useNotifications } from '@/components/NotificationProvider'
import { AssetsSubNav } from './AssetsSubNav'
import { useAssetsVault } from './shared/useAssetsVault'
import { AssetCard } from './shared/AssetCard'

export function CreditsVaultView() {
  const { addToast } = useNotifications()
  const {
    assets,
    setAssets,
    loading,
    loadError,
    totalCreditValue,
    setTotalCreditValue,
    fetchAssets,
  } = useAssetsVault()

  const creditAssets = useMemo(
    () =>
      assets
        .filter((a) => !a.is_folder && a.title !== 'README.txt')
        .sort((a, b) => (b.credit_value ?? 0) - (a.credit_value ?? 0)),
    [assets],
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this asset from your arsenal?')) return
    try {
      const res = await fetch(`/api/assets?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        await fetchAssets()
        addToast('Deleted', 'Asset removed successfully', 'success')
      } else {
        addToast('Error', 'Failed to delete asset', 'error')
      }
    } catch {
      addToast('Error', 'Failed to delete asset', 'error')
    }
  }

  return (
    <motion.div className="assets-page page-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="assets-hero ui-hero-row page-header">
        <div className="ui-hero-row__main page-header__main">
          <h1 className="page-header__title">
            Credits & <span className="page-header__title-accent">value</span>
          </h1>
          <p className="page-header__desc">
            Set credit values on every asset in your arsenal. {formatCreditCapHint()}.
          </p>
          <div className="assets-value-card ui-panel ui-panel--accent ui-panel--compact">
            <Coins size={20} color="var(--brand)" />
            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  color: 'var(--text-sub)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Total arsenal value
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 950, color: 'var(--text-main)' }}>
                {formatCredits(totalCreditValue)}
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sub)', marginLeft: '0.5rem' }}>
                  {formatGbpApprox(totalCreditValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AssetsSubNav />

      {loadError && !loading ? (
        <div className="assets-empty ui-panel ui-panel--dashed">
          <AlertCircle size={40} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
          <p style={{ color: 'var(--text-sub)' }}>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void fetchAssets()}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <motion.div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--brand)', margin: '0 auto' }} />
        </motion.div>
      ) : creditAssets.length === 0 ? (
        <div className="assets-empty ui-panel ui-panel--dashed">
          <Coins size={48} style={{ margin: '0 auto 1rem', opacity: 0.15 }} />
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>No assets yet</h3>
          <p style={{ color: 'var(--text-sub)', marginBottom: '1rem' }}>
            Upload files or links first, then assign credit values here.
          </p>
          <Link href="/assets/storage" className="btn btn-primary">
            Go to Storage & files
          </Link>
        </div>
      ) : (
        <div className="assets-grid">
          <AnimatePresence mode="popLayout">
            {creditAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                variant="credits"
                onDelete={() => void handleDelete(asset.id)}
                onListed={() => void fetchAssets()}
                onCreditUpdated={(credit_value) => {
                  setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, credit_value } : a)))
                  setTotalCreditValue((prev) => prev - (asset.credit_value ?? 0) + credit_value)
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
