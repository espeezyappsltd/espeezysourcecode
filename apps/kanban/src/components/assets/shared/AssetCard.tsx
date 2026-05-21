'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  File,
  Link as LinkIcon,
  ShoppingBag,
  Trash2,
  ExternalLink,
  Loader2,
  Pencil,
} from 'lucide-react'
import {
  MAX_ASSET_CREDIT_VALUE,
  formatCredits,
  formatGbpApprox,
} from '@/lib/credits'
import { EN_DASH } from '@/lib/ui-symbols'
import { useNotifications } from '@/components/NotificationProvider'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { marketplaceListFromAssetCopy } from '@/lib/platform/transaction-confirm-copy'
import { FormField } from '@/components/forms/FormField'
import type { VaultAsset } from './types'

export type AssetCardVariant = 'storage' | 'credits' | 'marketplace'

export function AssetCard({
  asset,
  variant,
  onDelete,
  onListed,
  onCreditUpdated,
}: {
  asset: VaultAsset
  variant: AssetCardVariant
  onDelete: () => void
  onListed: () => void
  onCreditUpdated: (creditValue: number) => void
}) {
  const { addToast } = useNotifications()
  const { confirmTransaction } = useTransactionConfirm()
  const [editingCredit, setEditingCredit] = useState(false)
  const [creditInput, setCreditInput] = useState(String(asset.credit_value ?? 0))
  const [savingCredit, setSavingCredit] = useState(false)
  const [listing, setListing] = useState(false)
  const Icon = asset.asset_type === 'file' ? File : asset.asset_type === 'link' ? LinkIcon : ShoppingBag

  const showCreditBlock = variant === 'credits' || variant === 'marketplace'
  const showMarketplaceActions = variant === 'marketplace'
  const showDelete = variant === 'storage' || variant === 'credits'

  const listOnMarketplace = async () => {
    const ok = await confirmTransaction(
      marketplaceListFromAssetCopy(asset.title, asset.credit_value ?? 0),
    )
    if (!ok) return

    setListing(true)
    try {
      const res = await fetch('/api/marketplace/list-from-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assetId: asset.id }),
      })
      const data = (await res.json()) as { error?: string; listing?: { id: string; title: string } }
      if (!res.ok) throw new Error(data.error ?? 'Could not list asset')
      addToast('Listed', `"${data.listing?.title ?? asset.title}" is on the marketplace.`, 'success')
      onListed()
    } catch (e) {
      addToast('Error', e instanceof Error ? e.message : 'Listing failed', 'error')
    } finally {
      setListing(false)
    }
  }

  const saveCreditValue = async () => {
    const next = parseInt(creditInput, 10)
    if (Number.isNaN(next) || next < 0 || next > MAX_ASSET_CREDIT_VALUE) {
      addToast('Invalid value', `Enter 0${EN_DASH}${MAX_ASSET_CREDIT_VALUE} credits.`, 'error')
      return
    }
    setSavingCredit(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: asset.id, credit_value: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      onCreditUpdated(data.asset.credit_value ?? next)
      setEditingCredit(false)
      addToast('Updated', 'Asset credit value saved.', 'success')
    } catch (e) {
      addToast('Error', e instanceof Error ? e.message : 'Could not update credit value', 'error')
    } finally {
      setSavingCredit(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="ui-card hover-card"
    >
      <div className="ui-card__media">
        {asset.preview_url ? (
          <img
            src={asset.preview_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Icon size={36} style={{ opacity: 0.2, color: 'var(--text-sub)' }} aria-hidden />
        )}
        {showDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(239, 68, 68, 0.12)',
              border: 'none',
              color: '#ef4444',
              padding: 8,
              borderRadius: 10,
              cursor: 'pointer',
            }}
            aria-label={`Delete ${asset.title}`}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        )}
      </div>

      <div className="ui-card__body">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '0.35rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main)' }}>{asset.title}</h3>
          <span
            style={{
              fontSize: '0.58rem',
              fontWeight: 950,
              background: 'var(--bg-sub)',
              padding: '2px 7px',
              borderRadius: 6,
              color: 'var(--brand)',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            {asset.asset_type === 'marketplace_ref' ? 'listed' : asset.asset_type}
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-sub)', lineHeight: 1.45, minHeight: '2.2rem' }}>
          {asset.description || 'No description provided.'}
        </p>

        {variant === 'storage' && (
          <p style={{ margin: '0.65rem 0 0', fontSize: '0.72rem', color: 'var(--text-sub)', fontWeight: 700 }}>
            Value: {formatCredits(asset.credit_value ?? 0)}
            <span style={{ marginLeft: '0.35rem', opacity: 0.8 }}>
              · edit in <Link href="/assets/credits">Credits</Link>
            </span>
          </p>
        )}

        {showCreditBlock && (
          <motion.div
            style={{
              marginTop: '0.85rem',
              padding: '0.65rem',
              background: 'var(--bg-sub)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: editingCredit ? '0.5rem' : 0,
              }}
            >
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  color: 'var(--text-sub)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Asset value
              </span>
              {variant === 'credits' && !editingCredit && (
                <button
                  type="button"
                  onClick={() => {
                    setCreditInput(String(asset.credit_value ?? 0))
                    setEditingCredit(true)
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', padding: 4 }}
                  aria-label="Edit credit value"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
            {variant === 'credits' && editingCredit ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <FormField label="Asset value" hideLabel>
                    <input
                      type="number"
                      min={0}
                      max={MAX_ASSET_CREDIT_VALUE}
                      value={creditInput}
                      onChange={(e) => setCreditInput(e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    />
                  </FormField>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  disabled={savingCredit}
                  onClick={() => void saveCreditValue()}
                >
                  {savingCredit ? '\u2026' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => setEditingCredit(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--brand)' }}>
                {formatCredits(asset.credit_value ?? 0)}
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-sub)', marginLeft: '0.35rem' }}>
                  {formatGbpApprox(asset.credit_value ?? 0)}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {showMarketplaceActions &&
          (asset.marketplace_listing_id ? (
            <Link
              href={`/marketplace?highlight=${asset.marketplace_listing_id}`}
              style={{
                marginTop: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.6rem',
                borderRadius: 12,
                background: 'var(--bg-sub)',
                border: '1px solid var(--border)',
                color: 'var(--brand)',
                fontWeight: 900,
                fontSize: '0.78rem',
                textDecoration: 'none',
              }}
            >
              <ShoppingBag size={14} /> View marketplace listing
            </Link>
          ) : asset.asset_type !== 'marketplace_ref' ? (
            <button
              type="button"
              disabled={listing}
              onClick={() => void listOnMarketplace()}
              className="btn btn-primary"
              style={{
                marginTop: '0.85rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
              }}
            >
              {listing ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
              List on marketplace
            </button>
          ) : null)}

        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.68rem', color: 'var(--text-sub)', fontWeight: 700 }}>
            {new Date(asset.created_at).toLocaleDateString()}
          </span>
          {asset.asset_url && !asset.asset_url.startsWith('espeezy://') && (
            <a
              href={asset.asset_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.72rem',
                fontWeight: 900,
                color: 'var(--brand)',
                textDecoration: 'none',
              }}
            >
              Open <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
