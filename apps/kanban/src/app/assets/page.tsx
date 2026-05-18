'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  File,
  Link as LinkIcon,
  ShoppingBag,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  HardDrive,
  Coins,
  Pencil,
  Folder,
  FolderPlus,
  ChevronRight,
} from 'lucide-react'
import {
  MAX_ASSET_CREDIT_VALUE,
  formatCreditCapHint,
  formatCredits,
  formatGbpApprox,
} from '@/lib/credits'
import { EN_DASH } from '@/lib/ui-symbols'
import { joinFolderPath, normalizeFolderPath } from '@/lib/assets/folders'
import { formatStorageBytes, STORAGE_QUOTAS_BYTES } from '@/lib/storage-quotas'
import { motion, AnimatePresence } from 'framer-motion'
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
  is_folder?: boolean
  marketplace_listing_id?: string | null
  metadata?: { folder_path?: string; is_folder?: boolean }
}

export default function PersonalAssetsPage() {
  const { addToast } = useNotifications()
  const addToastRef = useRef(addToast)
  addToastRef.current = addToast
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'file' | 'link' | 'marketplace_ref'>('all')
  const [currentFolder, setCurrentFolder] = useState('/')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [totalCreditValue, setTotalCreditValue] = useState(0)
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageQuota, setStorageQuota] = useState(STORAGE_QUOTAS_BYTES.free)
  const [tierLabel, setTierLabel] = useState('free')

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/assets?all=1', { credentials: 'include' })
      const data = (await res.json().catch(() => ({}))) as {
        assets?: Asset[]
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
        const message = data.error || 'Failed to load assets'
        setLoadError(message)
        addToastRef.current('Error', message, 'error')
      }
    } catch {
      const message = 'Failed to load assets'
      setLoadError(message)
      addToastRef.current('Error', message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAssets()
  }, [fetchAssets])

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this asset from your arsenal?')) return
    try {
      const res = await fetch(`/api/assets?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        applyStoragePayload(data)
        await fetchAssets()
        addToast('Deleted', 'Asset removed successfully', 'success')
      } else {
        addToast('Error', 'Failed to delete asset', 'error')
      }
    } catch {
      addToast('Error', 'Failed to delete asset', 'error')
    }
  }

  const normCurrent = normalizeFolderPath(currentFolder)

  const childFolders = (() => {
    const map = new Map<string, string>()
    for (const a of assets) {
      if (a.is_folder) {
        const fp = normalizeFolderPath(a.metadata?.folder_path ?? a.folder)
        if (fp && fp !== normCurrent) {
          const parts = fp.split('/').filter(Boolean)
          const parentPath = parts.length <= 1 ? '/' : '/' + parts.slice(0, -1).join('/')
          if (parentPath === normCurrent) map.set(fp, a.title)
        }
        continue
      }
      const f = normalizeFolderPath(a.folder)
      if (normCurrent === '/') {
        const seg = f.split('/').filter(Boolean)[0]
        if (seg) map.set(`/${seg}`, seg)
      } else if (f.startsWith(`${normCurrent}/`)) {
        const rest = f.slice(normCurrent.length + 1)
        const seg = rest.split('/')[0]
        if (seg) map.set(`${normCurrent}/${seg}`, seg)
      }
    }
    return Array.from(map.entries()).map(([path, name]) => ({ path, name }))
  })()

  const filteredAssets = assets.filter((a) => {
    if (a.is_folder) return false
    if (a.title === 'README.txt') return false
    const matchesFilter = filter === 'all' || a.asset_type === filter
    const matchesFolder = normalizeFolderPath(a.folder) === normCurrent
    return matchesFilter && matchesFolder
  })

  const percentUsed = storageQuota > 0 ? Math.min(100, (storageUsed / storageQuota) * 100) : 0

  const createFolder = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const res = await fetch('/api/assets/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmed, parentFolder: normCurrent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not create folder')
      setCurrentFolder(data.folder ?? joinFolderPath(normCurrent, trimmed))
      setShowFolderModal(false)
      await fetchAssets()
      addToast('Folder created', `"${trimmed}" is ready for uploads.`, 'success')
    } catch (e) {
      addToast('Error', e instanceof Error ? e.message : 'Folder failed', 'error')
    }
  }

  const formatSize = formatStorageBytes

  const applyStoragePayload = (payload?: { storageUsed?: number; storageQuota?: number; tier?: string }) => {
    if (!payload) return
    if (typeof payload.storageUsed === 'number') setStorageUsed(payload.storageUsed)
    if (typeof payload.storageQuota === 'number') setStorageQuota(payload.storageQuota)
    if (payload.tier) setTierLabel(payload.tier)
  }

  const breadcrumbParts = normCurrent === '/' ? [] : normCurrent.split('/').filter(Boolean)

  return (
    <motion.div className="assets-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="assets-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h1>
            Personal <span>Arsenal</span>
          </h1>
          <p>
            Academic assets with Espeezy credit values for marketplace listings and cash conversion.{' '}
            {formatCreditCapHint()}.
          </p>
          <div className="assets-value-card">
            <Coins size={20} color="var(--brand)" />
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Total arsenal value
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 950, color: 'var(--text-main)' }}>
                {formatCredits(totalCreditValue)}
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sub)', marginLeft: '0.5rem' }}>
                  {formatGbpApprox(totalCreditValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="assets-storage-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.85rem' }}>
              <HardDrive size={16} color="var(--brand)" />
              Storage used
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--brand)' }}>
              {formatSize(storageUsed)} / {formatSize(storageQuota)}
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-sub)', borderRadius: '100px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentUsed}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: '100%', background: 'var(--brand)', borderRadius: '100px' }}
            />
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current tier: <span style={{ color: 'var(--text-main)' }}>{tierLabel.toUpperCase()}</span>
          </div>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: 'var(--text-sub)', lineHeight: 1.45 }}>
            Upload files into folders; storage is tracked on your profile node and enforced per plan.
          </p>
        </div>
      </header>

      <nav className="assets-breadcrumb" aria-label="Folder path">
        <button type="button" className={normCurrent === '/' ? 'active' : ''} onClick={() => setCurrentFolder('/')}>
          Root
        </button>
        {breadcrumbParts.map((segment, i) => {
          const path = '/' + breadcrumbParts.slice(0, i + 1).join('/')
          const isLast = i === breadcrumbParts.length - 1
          return (
            <span key={path} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ChevronRight size={14} style={{ opacity: 0.35 }} />
              <button type="button" className={isLast ? 'active' : ''} onClick={() => setCurrentFolder(path)}>
                {segment}
              </button>
            </span>
          )
        })}
      </nav>

      <div className="assets-toolbar">
        <div className="assets-filter-tabs">
          {(['all', 'file', 'link', 'marketplace_ref'] as const).map((f) => (
            <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f === 'marketplace_ref' ? 'Inventory' : f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setShowFolderModal(true)}>
            <FolderPlus size={16} /> New folder
          </button>
          <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setShowUploadModal(true)}>
            <Plus size={18} /> Add asset
          </button>
        </div>
      </div>

      {loadError && !loading ? (
        <div className="assets-empty">
          <AlertCircle size={40} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontWeight: 900 }}>Could not load arsenal</h3>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--text-sub)', fontWeight: 600, maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
            {loadError}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => void fetchAssets()}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <motion.div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--brand)', margin: '0 auto' }} />
        </motion.div>
      ) : (
        <>
          {childFolders.length > 0 && (
            <div className="assets-grid" style={{ marginBottom: '1.25rem' }}>
              {childFolders.map(({ path, name }) => (
                <button
                  key={path}
                  type="button"
                  className="assets-folder-tile"
                  onClick={() => setCurrentFolder(path)}
                >
                  <Folder size={28} color="var(--brand)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 900, color: 'var(--text-main)' }}>{name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', fontWeight: 600 }}>Open folder</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredAssets.length === 0 && childFolders.length === 0 ? (
            <div className="assets-empty">
              <File size={48} style={{ margin: '0 auto 1rem', opacity: 0.15, color: 'var(--text-sub)' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontWeight: 900 }}>No assets in this folder</h3>
              <p style={{ margin: '0 0 1.25rem', color: 'var(--text-sub)', fontWeight: 600, maxWidth: '28rem', marginLeft: 'auto', marginRight: 'auto' }}>
                Create a folder to organize lecture notes, or upload a file or link. Set a credit value, then list on the marketplace in one click.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFolderModal(true)}>
                  <FolderPlus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  New folder
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                  <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Add asset
                </button>
              </div>
            </div>
          ) : (
            <div className="assets-grid">
              <AnimatePresence mode="popLayout">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onDelete={() => void handleDelete(asset.id)}
                    onListed={() => void fetchAssets()}
                    onCreditUpdated={(credit_value) => {
                      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, credit_value } : a)))
                      setTotalCreditValue((prev) => prev - (asset.credit_value ?? 0) + credit_value)
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {showFolderModal && (
        <FolderModal onClose={() => setShowFolderModal(false)} onCreate={(name) => void createFolder(name)} />
      )}

      {showUploadModal && (
        <UploadModal
          currentFolder={normCurrent}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(storage) => {
            setShowUploadModal(false)
            applyStoragePayload(storage)
            void fetchAssets()
          }}
        />
      )}
    </motion.div>
  )
}

function AssetCard({
  asset,
  onDelete,
  onListed,
  onCreditUpdated,
}: {
  asset: Asset
  onDelete: () => void
  onListed: () => void
  onCreditUpdated: (creditValue: number) => void
}) {
  const { addToast } = useNotifications()
  const [editingCredit, setEditingCredit] = useState(false)
  const [creditInput, setCreditInput] = useState(String(asset.credit_value ?? 0))
  const [savingCredit, setSavingCredit] = useState(false)
  const [listing, setListing] = useState(false)
  const Icon = asset.asset_type === 'file' ? File : asset.asset_type === 'link' ? LinkIcon : ShoppingBag

  const listOnMarketplace = async () => {
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
      style={{
        background: 'var(--surface)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="hover-card"
    >
      <div style={{ height: '140px', background: 'var(--bg-sub)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {asset.preview_url ? (
          <img src={asset.preview_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Icon size={36} style={{ opacity: 0.2, color: 'var(--text-sub)' }} />
        )}
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
          title="Delete asset"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ padding: '1.15rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main)' }}>{asset.title}</h3>
          <span style={{ fontSize: '0.58rem', fontWeight: 950, background: 'var(--bg-sub)', padding: '2px 7px', borderRadius: 6, color: 'var(--brand)', textTransform: 'uppercase', flexShrink: 0 }}>
            {asset.asset_type === 'marketplace_ref' ? 'listed' : asset.asset_type}
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-sub)', lineHeight: 1.45, minHeight: '2.2rem' }}>
          {asset.description || 'No description provided.'}
        </p>

        <motion.div style={{ marginTop: '0.85rem', padding: '0.65rem', background: 'var(--bg-sub)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingCredit ? '0.5rem' : 0 }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asset value</span>
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
              <button type="button" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} disabled={savingCredit} onClick={() => void saveCreditValue()}>
                {savingCredit ? '\u2026' : 'Save'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setEditingCredit(false)}>
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

        {asset.marketplace_listing_id ? (
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
            style={{ marginTop: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
          >
            {listing ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
            List on marketplace
          </button>
        ) : null}

        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-sub)', fontWeight: 700 }}>{new Date(asset.created_at).toLocaleDateString()}</span>
          {asset.asset_url && !asset.asset_url.startsWith('espeezy://') && (
            <a
              href={asset.asset_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 900, color: 'var(--brand)', textDecoration: 'none' }}
            >
              Open <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function FolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <ModalOverlay maxWidth="400px" onClickOutside={onClose}>
      <div style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontWeight: 950, color: 'var(--text-main)' }}>New folder</h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
          Organize uploads in a virtual folder. Names cannot include slashes.
        </p>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lecture notes"
          style={{ width: '100%', marginBottom: '1rem' }}
          onKeyDown={(e) => e.key === 'Enter' && onCreate(name)}
        />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => onCreate(name)}>
            Create
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

function UploadModal({
  currentFolder,
  onClose,
  onSuccess,
}: {
  currentFolder: string
  onClose: () => void
  onSuccess: (storage?: { storageUsed?: number; storageQuota?: number; tier?: string }) => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    asset_type: 'file' as Asset['asset_type'],
    asset_url: '',
    category: '',
    credit_value: '0',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
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
        res = await fetch('/api/assets', { method: 'POST', body: formData, credentials: 'include' })
      } else {
        res = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...form,
            folder: currentFolder,
            size_bytes: 0,
            credit_value: parseInt(form.credit_value, 10) || 0,
          }),
        })
      }

      const d = await res.json()
      if (res.ok) {
        onSuccess({
          storageUsed: d.storageUsed,
          storageQuota: d.storageQuota,
          tier: d.tier,
        })
      } else {
        setError(d.message || d.error || 'Failed to save asset')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay maxWidth="500px" onClickOutside={onClose}>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ margin: '0 0 0.35rem', fontWeight: 950, color: 'var(--text-main)' }}>Add asset</h2>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: 'var(--text-sub)' }}>
          Saving to folder: <strong>{currentFolder === '/' ? 'Root' : currentFolder}</strong>
        </p>

        {error && (
          <motion.div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 12, marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 700 }}>
            {error}
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Asset type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button type="button" onClick={() => setForm((f) => ({ ...f, asset_type: 'file' }))} className={form.asset_type === 'file' ? 'btn btn-primary' : 'btn btn-secondary'}>
                File
              </button>
              <button type="button" onClick={() => setForm((f) => ({ ...f, asset_type: 'link' }))} className={form.asset_type === 'link' ? 'btn btn-primary' : 'btn btn-secondary'}>
                Link
              </button>
            </div>
          </div>

          {form.asset_type === 'file' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Upload file</label>
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setFile(f)
                    if (!form.title) setForm((prev) => ({ ...prev, title: f.name }))
                  }
                }}
                style={{ width: '100%' }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Link URL</label>
              <input type="url" className="form-input" value={form.asset_url} onChange={(e) => setForm((f) => ({ ...f, asset_url: e.target.value }))} placeholder="https://..." />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Title</label>
            <input type="text" className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Design System V1" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Description (optional)</label>
            <textarea className="form-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief summary..." style={{ minHeight: 72, resize: 'none' }} />
          </div>

          <motion.div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-sub)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Asset value (credits)</label>
            <input
              type="number"
              min={0}
              max={MAX_ASSET_CREDIT_VALUE}
              className="form-input"
              value={form.credit_value}
              onChange={(e) => setForm((f) => ({ ...f, credit_value: e.target.value }))}
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 600 }}>
              {formatCreditCapHint()} · 50 credits ≈ 1 month Pro
            </p>
          </motion.div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button type="button" onClick={() => void handleSubmit()} disabled={loading} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {form.asset_type === 'file' ? 'Upload & save' : 'Save link'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
