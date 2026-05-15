'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  File, 
  Link as LinkIcon, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  ExternalLink,
  Loader2,
  HardDrive,
  Filter,
  MoreVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from '@/components/NotificationProvider'
import ModalOverlay from '@/components/ModalOverlay'

interface Asset {
  id: string
  title: string
  description?: string
  asset_type: 'file' | 'link' | 'marketplace_ref'
  asset_url: string
  preview_url?: string
  category?: string
  size_bytes: number
  created_at: string
}

const QUOTAS = {
  free: 1024 * 1024 * 1024, // 1GB
  pro: 5 * 1024 * 1024 * 1024, // 5GB
  premium: 20 * 1024 * 1024 * 1024, // 20GB
  admin: 100 * 1024 * 1024 * 1024, // 100GB
}

export default function PersonalAssetsPage() {
  const { profile } = useProfile()
  const { addToast } = useNotifications()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'file' | 'link' | 'marketplace_ref'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assets')
      if (res.ok) {
        const data = await res.json()
        setAssets(data.assets || [])
      }
    } catch (err) {
      addToast('Error', 'Failed to load assets', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this asset?')) return
    
    try {
      const res = await fetch(`/api/assets?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== id))
        addToast('Deleted', 'Asset removed successfully', 'success')
      }
    } catch (err) {
      addToast('Error', 'Failed to delete asset', 'error')
    }
  }

  const filteredAssets = assets.filter(a => filter === 'all' || a.asset_type === filter)
  
  const tier = (profile?.subscription_plan?.toLowerCase() as keyof typeof QUOTAS) || 'free'
  const quota = QUOTAS[tier]
  const storageUsed = assets.reduce((acc, a) => acc + (a.size_bytes || 0), 0)
  const percentUsed = Math.min(100, (storageUsed / quota) * 100)

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Header & Quota */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.05em', color: 'white', margin: 0 }}>
            Personal <span style={{ color: 'var(--brand)' }}>Inventory</span>
          </h1>
          <p style={{ color: 'var(--text-sub)', marginTop: '0.5rem', fontWeight: 600 }}>Your secure node for academic assets and marketplace refs.</p>
        </div>

        <div style={{ width: '320px', background: 'var(--bg-sub)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.85rem' }}>
              <HardDrive size={16} color="var(--brand)" />
              Storage Used
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--brand)' }}>{formatSize(storageUsed)} / {formatSize(quota)}</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentUsed}%` }}
              style={{ height: '100%', background: 'var(--brand)', borderRadius: '100px' }} 
            />
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Tier: <span style={{ color: 'white' }}>{tier.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', background: 'var(--bg-sub)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          {(['all', 'file', 'link', 'marketplace_ref'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: filter === f ? 'var(--brand)' : 'transparent',
                color: filter === f ? 'black' : 'var(--text-sub)',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: '0.2s',
                textTransform: 'capitalize'
              }}
            >
              {f === 'marketplace_ref' ? 'Inventory' : f}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowUploadModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
            background: 'var(--brand)', color: 'black', borderRadius: '16px', border: 'none',
            fontWeight: 950, fontSize: '0.9rem', cursor: 'pointer'
          }}
        >
          <Plus size={18} /> Add Asset
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--brand)', margin: '0 auto' }} />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '8rem 2rem', background: 'var(--bg-sub)', borderRadius: '32px', border: '2px dashed var(--border)' }}>
          <File size={48} style={{ margin: '0 auto', opacity: 0.1, marginBottom: '1.5rem' }} />
          <h3 style={{ color: 'var(--text-sub)', fontWeight: 800 }}>No assets found in this sector.</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence>
            {filteredAssets.map((asset, idx) => (
              <AssetCard key={asset.id} asset={asset} onDelete={() => handleDelete(asset.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal Placeholder */}
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={() => { setShowUploadModal(false); fetchAssets(); }} 
        />
      )}

    </div>
  )
}

function AssetCard({ asset, onDelete }: { asset: Asset, onDelete: () => void }) {
  const Icon = asset.asset_type === 'file' ? File : asset.asset_type === 'link' ? LinkIcon : ShoppingBag
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: 'var(--surface)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: '0.3s',
        position: 'relative'
      }}
      className="hover-card"
    >
      <div style={{ height: '160px', background: 'var(--bg-sub)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {asset.preview_url ? (
          <img src={asset.preview_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Icon size={40} style={{ opacity: 0.2 }} />
        )}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
            title="Delete Asset"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{asset.title}</h3>
          <span style={{ fontSize: '0.6rem', fontWeight: 950, background: 'var(--bg-sub)', padding: '2px 8px', borderRadius: '6px', color: 'var(--brand)', textTransform: 'uppercase' }}>{asset.asset_type}</span>
        </div>
        
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.5, height: '2.4rem', overflow: 'hidden' }}>{asset.description || 'No description provided.'}</p>
        
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 700 }}>
            {new Date(asset.created_at).toLocaleDateString()}
          </div>
          <a 
            href={asset.asset_url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 900, 
              color: 'var(--brand)', textDecoration: 'none'
            }}
          >
            OPEN <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  )
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', asset_type: 'file' as const, asset_url: '', category: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSumbit = async () => {
    if (!form.title || !form.asset_url) return setError('Title and URL are required')
    setLoading(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, size_bytes: form.asset_type === 'file' ? 1024 * 1024 : 0 }) // Mocking size for links/refs
      })
      if (res.ok) onSuccess()
      else {
        const d = await res.json()
        setError(d.error || 'Failed to save asset')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay maxWidth="500px" onClickOutside={onClose}>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontWeight: 950 }}>Add New Asset</h2>
        
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Asset Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button 
                onClick={() => setForm(f => ({ ...f, asset_type: 'file' }))}
                style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: form.asset_type === 'file' ? 'var(--brand)' : 'var(--bg-sub)', color: form.asset_type === 'file' ? 'black' : 'white', fontWeight: 800, cursor: 'pointer' }}
              >File</button>
              <button 
                onClick={() => setForm(f => ({ ...f, asset_type: 'link' }))}
                style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: form.asset_type === 'link' ? 'var(--brand)' : 'var(--bg-sub)', color: form.asset_type === 'link' ? 'black' : 'white', fontWeight: 800, cursor: 'pointer' }}
              >Link</button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Title</label>
            <input 
              type="text" 
              className="form-input" 
              value={form.title} 
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Design System V1"
              style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{form.asset_type === 'file' ? 'File URL' : 'Link URL'}</label>
            <input 
              type="url" 
              className="form-input" 
              value={form.asset_url} 
              onChange={e => setForm(f => ({ ...f, asset_url: e.target.value }))}
              placeholder="https://..."
              style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Description (Optional)</label>
            <textarea 
              className="form-input" 
              value={form.description} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="A brief summary of this asset..."
              style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', minHeight: '80px', resize: 'none' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button 
            onClick={handleSumbit} 
            disabled={loading}
            className="btn btn-primary" 
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Save Asset
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
