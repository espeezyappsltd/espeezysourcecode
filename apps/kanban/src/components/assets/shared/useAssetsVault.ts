'use client'

import { useCallback, useEffect, useState } from 'react'
import { STORAGE_QUOTAS_BYTES } from '@/lib/storage-quotas'
import type { AssetsVaultSnapshot, VaultAsset } from './types'

export function useAssetsVault() {
  const [assets, setAssets] = useState<VaultAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalCreditValue, setTotalCreditValue] = useState(0)
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageQuota, setStorageQuota] = useState(STORAGE_QUOTAS_BYTES.free)
  const [tierLabel, setTierLabel] = useState('free')

  const applyStoragePayload = useCallback(
    (payload?: { storageUsed?: number; storageQuota?: number; tier?: string }) => {
      if (!payload) return
      if (typeof payload.storageUsed === 'number') setStorageUsed(payload.storageUsed)
      if (typeof payload.storageQuota === 'number') setStorageQuota(payload.storageQuota)
      if (payload.tier) setTierLabel(payload.tier)
    },
    [],
  )

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/assets?all=1', { credentials: 'include' })
      const data = (await res.json().catch(() => ({}))) as {
        assets?: VaultAsset[]
        totalCreditValue?: number
        storageUsed?: number
        storageQuota?: number
        tier?: string
        error?: string
      }
      if (res.ok) {
        setAssets(data.assets || [])
        setTotalCreditValue(data.totalCreditValue ?? 0)
        setStorageUsed(data.storageUsed ?? 0)
        setStorageQuota(data.storageQuota ?? STORAGE_QUOTAS_BYTES.free)
        setTierLabel(data.tier ?? 'free')
      } else {
        setLoadError(data.error || 'Failed to load assets')
      }
    } catch {
      setLoadError('Failed to load assets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAssets()
  }, [fetchAssets])

  const snapshot: AssetsVaultSnapshot = {
    storageUsed,
    storageQuota,
    tierLabel,
    totalCreditValue,
  }

  return {
    assets,
    setAssets,
    loading,
    loadError,
    snapshot,
    totalCreditValue,
    setTotalCreditValue,
    storageUsed,
    storageQuota,
    tierLabel,
    fetchAssets,
    applyStoragePayload,
  }
}
