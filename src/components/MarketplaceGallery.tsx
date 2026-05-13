'use client'

import { useEffect, useState } from 'react'
import { fetchMarketplaceAssets, MarketplaceAsset } from '@/src/services/marketplace'

const CATEGORY_COLORS: Record<string, string> = {
  Graphics: '#10b981',
  Logos: '#6366f1',
  Templates: '#f59e42',
  Icons: '#f43f5e',
  'UI Kits': '#0ea5e9',
  Mockups: '#a21caf',
  '3D': '#fbbf24',
  Fonts: '#eab308',
  Other: '#64748b',
}

export default function MarketplaceGallery() {
  const [assets, setAssets] = useState<MarketplaceAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')

  useEffect(() => {
    fetchMarketplaceAssets(category ? { category } : undefined)
      .then(setAssets)
      .finally(() => setLoading(false))
  }, [category])

  return (
    <section style={{ padding: '3rem 0', background: '#0a0a0a', minHeight: 600 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2vw' }}>
        <h1 style={{ fontWeight: 950, fontSize: '2.5rem', marginBottom: 24, color: 'white', letterSpacing: '-0.03em' }}>Marketplace</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {['All', ...Object.keys(CATEGORY_COLORS)].map(cat => (
            <button key={cat} onClick={() => setCategory(cat === 'All' ? '' : cat)} style={{
              background: category === cat || (cat === 'All' && !category) ? 'linear-gradient(90deg, #10b981 0%, #6366f1 100%)' : '#181828',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px 22px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              opacity: category === cat || (cat === 'All' && !category) ? 1 : 0.7,
              boxShadow: category === cat || (cat === 'All' && !category) ? '0 2px 12px rgba(16,185,129,0.12)' : undefined,
              transition: 'all 0.15s',
            }}>{cat}</button>
          ))}
        </div>
        {loading ? <div style={{ color: '#aaa', fontWeight: 700 }}>Loading assets...</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
            {assets.map(asset => (
              <div key={asset.id} style={{ background: '#181828', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, borderTop: `4px solid ${CATEGORY_COLORS[asset.category] || '#64748b'}` }}>
                {asset.preview_url && <img src={asset.preview_url} alt={asset.title} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 8, background: '#222' }} />}
                <div style={{ fontWeight: 900, fontSize: '1.15rem', color: 'white', marginBottom: 2 }}>{asset.title}</div>
                <div style={{ color: '#aaa', fontWeight: 500, fontSize: '0.97rem', minHeight: 38 }}>{asset.description}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  {asset.tags?.map(tag => <span key={tag} style={{ background: '#222', color: '#10b981', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.85rem' }}>#{tag}</span>)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
                  <span style={{ color: CATEGORY_COLORS[asset.category] || '#64748b', fontWeight: 800, fontSize: '0.95rem' }}>{asset.category}</span>
                  {asset.price ? <span style={{ color: '#f59e42', fontWeight: 900, marginLeft: 8 }}>${asset.price}</span> : <span style={{ color: '#10b981', fontWeight: 900, marginLeft: 8 }}>Free</span>}
                </div>
                <a href={asset.asset_url} target='_blank' rel='noopener' style={{ marginTop: 10, padding: '10px 0', borderRadius: 8, background: 'linear-gradient(90deg, #10b981 0%, #6366f1 100%)', color: 'white', fontWeight: 900, textAlign: 'center', textDecoration: 'none', fontSize: '1rem', letterSpacing: '-0.01em', boxShadow: '0 2px 8px rgba(16,185,129,0.08)' }}>Download</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
