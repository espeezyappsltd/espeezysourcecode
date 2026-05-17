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
  Coins,
  Pencil,
} from 'lucide-react'
import {
  MAX_ASSET_CREDIT_VALUE,
  creditsToGbpEquivalent,
  formatCreditCapHint,
  formatCredits,
} from '@/lib/credits'
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
  folder?: string
  credit_value?: number
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
  const [currentFolder, setCurrentFolder] = useState('/')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [totalCreditValue, setTotalCreditValue] = useState(0)
  
  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assets')
      if (res.ok) {
        const data = await res.json()
        setAssets(data.assets || [])
        setTotalCreditValue(data.totalCreditValue ?? 0)
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

  const filteredAssets = assets.filter(a => {
    const matchesFilter = filter === 'all' || a.asset_type === filter
    const matchesFolder = a.folder === currentFolder
    return matchesFilter && matchesFolder
  })
  
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
            Personal <span style={{ color: 'var(--brand)' }}>Arsenal</span>
          </h1>
          <p style={{ color: 'var(--text-sub)', marginTop: '0.5rem', fontWeight: 600, maxWidth: '520px' }}>
            Academic assets with Espeezy credit values for marketplace listings and cash conversion. {formatCreditCapHint()}.
          </p>
          <div
            style={{
              marginTop: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.25rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '14px',
            }}
          >
            <Coins size={20} color="var(--brand)" />
            <motion.div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Total arsenal value
              </div>
              <motion.div style={{ fontSize: '1.15rem', fontWeight: 950, color: 'white' }}>
                {formatCredits(totalCreditValue)}
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sub)', marginLeft: '0.5rem' }}>
                  â‰ˆ Â£{creditsToGbpEquivalent(totalCreditValue).toFixed(2)}
                </span>
              </motion.div>
            </motion.div>
          </div>
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

      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
        <button onClick={() => setCurrentFolder('/')} style={{ background: 'none', border: 'none', color: currentFolder === '/' ? 'white' : 'var(--text-sub)', cursor: 'pointer' }}>Root</button>
        {currentFolder !== '/' && currentFolder.split('/').filter(Boolean).map((f, i, arr) => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ opacity: 0.3 }}>/</span>
            <button 
              onClick={() => setCurrentFolder('/' + arr.slice(0, i + 1).join('/'))} 
              style={{ background: 'none', border: 'none', color: i === arr.length - 1 ? 'white' : 'var(--text-sub)', cursor: 'pointer' }}
            >
              {f}
            </button>
          </div>
        ))}
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

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => {
              const name = prompt('Folder name:')
              if (name) {
                // In a real app we'd create a dummy entry or just let users upload to new paths
                setCurrentFolder(currentFolder === '/' ? `/${name}` : `${currentFolder}/${name}`)
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem',
              background: 'var(--bg-sub)', color: 'white', borderRadius: '16px', border: '1px solid var(--border)',
              fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            New Folder
          </button>
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
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onDelete={() => handleDelete(asset.id)}
                onCreditUpdated={(credit_value) => {
                  setAssets((prev) =>
                    prev.map((a) => (a.id === asset.id ? { ...a, credit_value } : a)),
                  )
                  setTotalCreditValue((prev) => prev - (asset.credit_value ?? 0) + credit_value)
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal 
          currentFolder={currentFolder}
          onClose={() => setShowUploadModal(false)} 
          onSuccess={() => { setShowUploadModal(false); fetchAssets(); }} 
        />
      )}

    </div>
  )
}

function AssetCard({
  asset,
  onDelete,
  onCreditUpdated,
}: {
  asset: Asset
  onDelete: () => void
  onCreditUpdated: (creditValue: number) => void
}) {
  const { addToast } = useNotifications()
  const [editingCredit, setEditingCredit] = useState(false)
  const [creditInput, setCreditInput] = useState(String(asset.credit_value ?? 0))
  const [savingCredit, setSavingCredit] = useState(false)
  const Icon = asset.asset_type === 'file' ? File : asset.asset_type === 'link' ? LinkIcon : ShoppingBag

  const saveCreditValue = async () => {
    const next = parseInt(creditInput, 10)
    if (Number.isNaN(next) || next < 0 || next > MAX_ASSET_CREDIT_VALUE) {
      addToast('Invalid value', `Enter 0â€“${MAX_ASSET_CREDIT_VALUE} credits.`, 'error')
      return
    }
    setSavingCredit(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-sub)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingCredit ? '0.5rem' : 0 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asset value</span>
            {!editingCredit && (
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
          {editingCredit ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                max={MAX_ASSET_CREDIT_VALUE}
                value={creditInput}
                onChange={(e) => setCreditInput(e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              />
              <button type="button" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} disabled={savingCredit} onClick={saveCreditValue}>
                {savingCredit ? '…' : 'Save'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setEditingCredit(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--brand)' }}>
              {formatCredits(asset.credit_value ?? 0)}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-sub)', marginLeft: '0.35rem' }}>
                ≈ £{creditsToGbpEquivalent(asset.credit_value ?? 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
        
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

function UploadModal({ currentFolder, onClose, onSuccess }: { currentFolder: string, onClose: () => void, onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', asset_type: 'file' as Asset['asset_type'], asset_url: '', category: '', credit_value: '0' })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSumbit = async () => {
    if (!form.title && !file) return setError('Title or file is required')
    if (form.asset_type === 'link' && !form.asset_url) return setError('URL is required for links')
    
    setLoading(true)
    setError('')
    
    try {
      let res: Response

      if (form.asset_type === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', form.title || file.name)
        formData.append('description', form.description)
        formData.append('category', form.category)
        formData.append('folder', currentFolder)
        formData.append('credit_value', form.credit_value || '0')

        res = await fetch('/api/assets', {
          method: 'POST',
          body: formData
        })
      } else {
        res = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            folder: currentFolder,
            size_bytes: 0,
            credit_value: parseInt(form.credit_value, 10) || 0,
          })
        })
      }

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

          {form.asset_type === 'file' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Upload File</label>
              <input 
                type="file" 
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setFile(f)
                    if (!form.title) setForm(prev => ({ ...prev, title: f.name }))
                  }
                }}
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-sub)', border: '1px dashed var(--border)', borderRadius: '12px', color: 'white' }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Link URL</label>
              <input 
                type="url" 
                className="form-input" 
                value={form.asset_url} 
                onChange={e => setForm(f => ({ ...f, asset_url: e.target.value }))}
                placeholder="https://..."
                style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}
              />
            </div>
          )}

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
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Description (Optional)</label>
            <textarea 
              className="form-input" 
              value={form.description} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="A brief summary of this asset..."
              style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', minHeight: '80px', resize: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Asset value (credits)
            </label>
            <input
              type="number"
              min={0}
              max={MAX_ASSET_CREDIT_VALUE}
              className="form-input"
              value={form.credit_value}
              onChange={(e) => setForm((f) => ({ ...f, credit_value: e.target.value }))}
              style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 600 }}>
              {formatCreditCapHint()} · 50 credits ≈ 1 month Pro
            </p>
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
            {form.asset_type === 'file' ? 'Upload & Save' : 'Save Link'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
