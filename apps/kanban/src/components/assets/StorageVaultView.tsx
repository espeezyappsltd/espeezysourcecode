'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  File,
  Plus,
  AlertCircle,
  Loader2,
  Folder,
  FolderPlus,
  ChevronRight,
} from 'lucide-react'
import { joinFolderPath, normalizeFolderPath } from '@/lib/assets/folders'
import { useNotifications } from '@/components/NotificationProvider'
import { AssetsSubNav } from './AssetsSubNav'
import { useAssetsVault } from './shared/useAssetsVault'
import { AssetCard } from './shared/AssetCard'
import { FolderModal } from './shared/FolderModal'
import { UploadModal } from './shared/UploadModal'
import { StorageMeter } from './shared/StorageMeter'

export function StorageVaultView() {
  const { addToast } = useNotifications()
  const {
    assets,
    setAssets,
    loading,
    loadError,
    snapshot,
    fetchAssets,
    applyStoragePayload,
  } = useAssetsVault()

  const [currentFolder, setCurrentFolder] = useState('/')
  const [filter, setFilter] = useState<'all' | 'file' | 'link'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)

  const normCurrent = normalizeFolderPath(currentFolder)

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
    if (a.asset_type === 'marketplace_ref') return false
    const matchesFilter = filter === 'all' || a.asset_type === filter
    const matchesFolder = normalizeFolderPath(a.folder) === normCurrent
    return matchesFilter && matchesFolder
  })

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

  const breadcrumbParts = normCurrent === '/' ? [] : normCurrent.split('/').filter(Boolean)

  return (
    <motion.div className="assets-page page-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="assets-hero ui-hero-row page-header">
        <div className="ui-hero-row__main page-header__main">
          <h1 className="page-header__title">
            Storage & <span className="page-header__title-accent">files</span>
          </h1>
          <p className="page-header__desc">
            Upload files and links into folders. Marketplace purchases land in MARKETPLACE BUYS automatically.
          </p>
        </div>
        <div className="ui-hero-row__aside ui-hero-row__aside--fixed">
          <StorageMeter
            storageUsed={snapshot.storageUsed}
            storageQuota={snapshot.storageQuota}
            tierLabel={snapshot.tierLabel}
          />
        </div>
      </header>

      <AssetsSubNav />

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
        <div className="assets-filter-tabs ui-panel ui-panel--inset ui-panel--compact">
          {(['all', 'file', 'link'] as const).map((f) => (
            <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setShowFolderModal(true)}
          >
            <FolderPlus size={16} /> New folder
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setShowUploadModal(true)}
          >
            <Plus size={18} /> Add asset
          </button>
        </div>
      </div>

      {loadError && !loading ? (
        <div className="assets-empty ui-panel ui-panel--dashed">
          <AlertCircle size={40} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontWeight: 900 }}>Could not load arsenal</h3>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--text-sub)', fontWeight: 600 }}>{loadError}</p>
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
                  className="assets-folder-tile ui-panel ui-panel--compact"
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
            <div className="assets-empty ui-panel ui-panel--dashed">
              <File size={48} style={{ margin: '0 auto 1rem', opacity: 0.15, color: 'var(--text-sub)' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontWeight: 900 }}>No assets in this folder</h3>
              <p style={{ margin: '0 0 1.25rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                Create a folder or upload a file or link. Set credit values under Credits when you are ready to sell.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFolderModal(true)}>
                  New folder
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
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
                    variant="storage"
                    onDelete={() => void handleDelete(asset.id)}
                    onListed={() => void fetchAssets()}
                    onCreditUpdated={(credit_value) => {
                      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, credit_value } : a)))
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
