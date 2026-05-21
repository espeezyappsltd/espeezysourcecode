export type VaultAsset = {
  id: string
  title: string
  description?: string
  asset_type: 'file' | 'link' | 'marketplace_ref'
  asset_url: string
  preview_url?: string
  category?: string
  size_bytes: number
  created_at: string
  folder?: string
  credit_value?: number
  is_folder?: boolean
  marketplace_listing_id?: string | null
  metadata?: { folder_path?: string; is_folder?: boolean }
}

export type AssetsVaultSnapshot = {
  storageUsed: number
  storageQuota: number
  tierLabel: string
  totalCreditValue: number
}
