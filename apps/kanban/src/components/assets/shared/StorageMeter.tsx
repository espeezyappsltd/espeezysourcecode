'use client'

import { motion } from 'framer-motion'
import { HardDrive } from 'lucide-react'
import { formatStorageBytes } from '@/lib/storage-quotas'

export function StorageMeter({
  storageUsed,
  storageQuota,
  tierLabel,
  compact = false,
}: {
  storageUsed: number
  storageQuota: number
  tierLabel: string
  compact?: boolean
}) {
  const percentUsed = storageQuota > 0 ? Math.min(100, (storageUsed / storageQuota) * 100) : 0

  return (
    <div
      className={`assets-storage-card ui-panel${compact ? ' ui-panel--compact' : ''}`}
      role="group"
      aria-label="Storage usage"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.85rem',
          }}
        >
          <HardDrive size={16} color="var(--brand)" />
          Storage used
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--brand)' }}>
          {formatStorageBytes(storageUsed)} / {formatStorageBytes(storageQuota)}
        </span>
      </div>
      <div
        style={{ height: '8px', background: 'var(--bg-sub)', borderRadius: '100px', overflow: 'hidden' }}
        role="progressbar"
        aria-valuenow={Math.round(percentUsed)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(percentUsed)} percent of storage quota used`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentUsed}%` }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', background: 'var(--brand)', borderRadius: '100px' }}
        />
      </div>
      <div
        style={{
          marginTop: '0.75rem',
          fontSize: '0.65rem',
          color: 'var(--text-sub)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Plan: <span style={{ color: 'var(--text-main)' }}>{tierLabel.toUpperCase()}</span>
        {!compact && <span style={{ marginLeft: '0.5rem' }}>· {percentUsed}% used</span>}
      </div>
    </div>
  )
}
