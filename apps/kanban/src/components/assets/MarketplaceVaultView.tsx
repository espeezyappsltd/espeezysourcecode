'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2, ShoppingBag } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'
import { TradingMetricsDashboard } from '@/components/assets/TradingMetricsDashboard'
import { AssetsSubNav } from './AssetsSubNav'
import { useAssetsVault } from './shared/useAssetsVault'
import { AssetCard } from './shared/AssetCard'

export function MarketplaceVaultView() {
  const { addToast } = useNotifications()
  const { assets, setAssets, loading, loadError, setTotalCreditValue, fetchAssets } = useAssetsVault()

  const inventory = useMemo(
    () => assets.filter((a) => !a.is_folder && a.asset_type === 'marketplace_ref'),
    [assets],
  )

  const readyToList = useMemo(
    () =>
      assets.filter(
        (a) =>
          !a.is_folder &&
          a.title !== 'README.txt' &&
          a.asset_type !== 'marketplace_ref' &&
          !a.marketplace_listing_id &&
          (a.asset_type === 'file' || a.asset_type === 'link'),
      ),
    [assets],
  )

  const listedFromVault = useMemo(
    () => assets.filter((a) => !a.is_folder && a.marketplace_listing_id && a.asset_type !== 'marketplace_ref'),
    [assets],
  )

  return (
    <motion.div className="assets-page page-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="assets-hero ui-hero-row page-header">
        <div className="ui-hero-row__main page-header__main">
          <h1 className="page-header__title">
            Marketplace <span className="page-header__title-accent">desk</span>
          </h1>
          <p className="page-header__desc">
            Track sales, withdraw earnings, list assets from your vault, and open purchased inventory refs.
          </p>
        </div>
      </header>

      <AssetsSubNav />

      <TradingMetricsDashboard />

      {loadError && !loading ? (
        <div className="assets-empty ui-panel ui-panel--dashed" style={{ marginTop: '1.5rem' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
          <p style={{ color: 'var(--text-sub)' }}>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void fetchAssets()}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <motion.div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--brand)', margin: '0 auto' }} />
        </motion.div>
      ) : (
        <>
          {readyToList.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 className="assets-section-title">Ready to list</h2>
              <p className="assets-section-desc">
                Assets in your vault that are not on the marketplace yet. Set credit values under{' '}
                <Link href="/assets/credits">Credits</Link> before listing.
              </p>
              <div className="assets-grid">
                <AnimatePresence mode="popLayout">
                  {readyToList.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      variant="marketplace"
                      onDelete={() => {}}
                      onListed={() => void fetchAssets()}
                      onCreditUpdated={(credit_value) => {
                        setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, credit_value } : a)))
                        setTotalCreditValue((prev) => prev - (asset.credit_value ?? 0) + credit_value)
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {listedFromVault.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 className="assets-section-title">Active listings</h2>
              <p className="assets-section-desc">Vault assets currently listed on the campus marketplace.</p>
              <div className="assets-grid">
                {listedFromVault.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    variant="marketplace"
                    onDelete={() => {}}
                    onListed={() => void fetchAssets()}
                    onCreditUpdated={(credit_value) => {
                      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, credit_value } : a)))
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="assets-section-title">Purchased inventory</h2>
            <p className="assets-section-desc">
              References from marketplace buys (also filed under MARKETPLACE BUYS in{' '}
              <Link href="/assets/storage">Storage</Link>).
            </p>
            {inventory.length === 0 ? (
              <div className="assets-empty ui-panel ui-panel--dashed">
                <ShoppingBag size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p style={{ color: 'var(--text-sub)', fontWeight: 600 }}>No purchased inventory refs yet.</p>
                <Link href="/marketplace" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Browse marketplace
                </Link>
              </div>
            ) : (
              <div className="assets-grid">
                {inventory.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    variant="marketplace"
                    onDelete={() => {}}
                    onListed={() => void fetchAssets()}
                    onCreditUpdated={() => {}}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </motion.div>
  )
}
