import { z } from 'zod'

export const AssetSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  title: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(50),
  asset_url: z.string().url(),
  preview_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  is_featured: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type MarketplaceAsset = z.infer<typeof AssetSchema>

export async function fetchMarketplaceAssets(params?: { category?: string; tag?: string }) {
  const url = new URL('/api/marketplace', window.location.origin)
  if (params?.category) url.searchParams.set('category', params.category)
  if (params?.tag) url.searchParams.set('tag', params.tag)
  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch assets')
  const { assets } = await res.json()
  return assets as MarketplaceAsset[]
}

export async function createMarketplaceAsset(asset: Omit<MarketplaceAsset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const res = await fetch('/api/marketplace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  })
  if (!res.ok) throw new Error('Failed to create asset')
  const { asset: created } = await res.json()
  return created as MarketplaceAsset
}
