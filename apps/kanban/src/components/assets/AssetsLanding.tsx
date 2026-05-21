'use client'

import Link from 'next/link'
import { ArrowRight, Coins, HardDrive, ShoppingBag, FolderOpen } from 'lucide-react'
import { formatCreditCapHint, formatCredits, formatGbpApprox } from '@/lib/credits'
import { formatStorageBytes } from '@/lib/storage-quotas'
import { AssetsPageFrame } from './AssetsPageFrame'
import { AssetsMotionRoot } from './AssetsMotionRoot'
import { AssetsSubNav } from './AssetsSubNav'
import { useAssetsVault } from './shared/useAssetsVault'

const HUB_CARDS = [
  {
    href: '/assets/storage',
    title: 'Storage & files',
    description: 'Upload files, save links, and organize folders. Storage counts against your plan quota.',
    icon: HardDrive,
    accent: 'var(--brand)',
  },
  {
    href: '/assets/credits',
    title: 'Credits & value',
    description: 'Set Espeezy credit values on each asset for marketplace pricing and cash conversion.',
    icon: Coins,
    accent: '#f59e0b',
  },
  {
    href: '/assets/marketplace',
    title: 'Marketplace',
    description: 'List assets, track sales, withdraw earnings, and manage marketplace inventory.',
    icon: ShoppingBag,
    accent: 'var(--success)',
  },
] as const

export function AssetsLanding() {
  const { assets, loading, snapshot } = useAssetsVault()

  const fileCount = assets.filter(
    (a) => !a.is_folder && a.title !== 'README.txt' && (a.asset_type === 'file' || a.asset_type === 'link'),
  ).length
  const listedCount = assets.filter((a) => a.asset_type === 'marketplace_ref' || a.marketplace_listing_id).length
  const percentUsed =
    snapshot.storageQuota > 0
      ? Math.min(100, Math.round((snapshot.storageUsed / snapshot.storageQuota) * 100))
      : 0

  const statusMessage = loading ? 'Loading Personal Arsenal overview.' : null

  return (
    <AssetsPageFrame statusMessage={statusMessage}>
      <AssetsMotionRoot className="assets-page page-shell">
      <header className="assets-hero ui-hero-row page-header">
        <div className="ui-hero-row__main page-header__main">
          <h1 className="page-header__title">
            Personal <span className="page-header__title-accent">Arsenal</span>
          </h1>
          <p className="page-header__desc">
            Your academic vault — organized into storage, credit values, and marketplace tools.{' '}
            {formatCreditCapHint()}.
          </p>
        </div>
      </header>

      <AssetsSubNav />

      <section className="assets-hub-stats" aria-labelledby="assets-hub-stats-heading">
        <h2 id="assets-hub-stats-heading" className="sr-only">
          Arsenal summary
        </h2>
        <div className="assets-hub-stat ui-panel ui-panel--compact">
          <FolderOpen size={18} color="var(--brand)" aria-hidden />
          <div>
            <div className="assets-hub-stat__label">Files & links</div>
            <div className="assets-hub-stat__value" aria-busy={loading}>
              {loading ? 'Loading' : fileCount}
            </div>
          </div>
        </div>
        <div className="assets-hub-stat ui-panel ui-panel--compact">
          <Coins size={18} color="#f59e0b" aria-hidden />
          <div>
            <div className="assets-hub-stat__label">Arsenal value</div>
            <div className="assets-hub-stat__value">
              {loading ? '…' : formatCredits(snapshot.totalCreditValue)}
              <span className="assets-hub-stat__sub">{formatGbpApprox(snapshot.totalCreditValue)}</span>
            </div>
          </div>
        </div>
        <div className="assets-hub-stat ui-panel ui-panel--compact">
          <HardDrive size={18} color="var(--brand)" />
          <div>
            <div className="assets-hub-stat__label">Storage</div>
            <div className="assets-hub-stat__value">
              {loading ? '…' : `${percentUsed}%`}
              <span className="assets-hub-stat__sub">
                {formatStorageBytes(snapshot.storageUsed)} / {formatStorageBytes(snapshot.storageQuota)}
              </span>
            </div>
          </div>
        </div>
        <div className="assets-hub-stat ui-panel ui-panel--compact">
          <ShoppingBag size={18} color="var(--success)" aria-hidden />
          <div>
            <div className="assets-hub-stat__label">Marketplace</div>
            <div className="assets-hub-stat__value">{loading ? '…' : listedCount}</div>
            <div className="assets-hub-stat__hint">listed / purchased refs</div>
          </div>
        </div>
      </section>

      <section className="assets-hub-grid" aria-labelledby="assets-hub-sections-heading">
        <h2 id="assets-hub-sections-heading" className="sr-only">
          Arsenal sections
        </h2>
        {HUB_CARDS.map(({ href, title, description, icon: Icon, accent }) => (
          <Link key={href} href={href} className="assets-hub-card ui-panel hover-card">
            <div className="assets-hub-card__icon" style={{ color: accent, borderColor: `${accent}33` }}>
              <Icon size={26} aria-hidden />
            </div>
            <h3 className="assets-hub-card__title">{title}</h3>
            <p className="assets-hub-card__desc">{description}</p>
            <span className="assets-hub-card__cta">
              Open <ArrowRight size={16} aria-hidden />
            </span>
          </Link>
        ))}
      </section>
      </AssetsMotionRoot>
    </AssetsPageFrame>
  )
}
