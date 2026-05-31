'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import { AssetsPageFrame } from './AssetsPageFrame'
import { AssetsMotionRoot } from './AssetsMotionRoot'
import { useAssetsVault } from './shared/useAssetsVault'
import { AssetCard } from './shared/AssetCard'
import { FolderModal } from './shared/FolderModal'
import { UploadModal } from './shared/UploadModal'
import { StorageMeter } from './shared/StorageMeter'
import { FilterTabGroup } from './shared/FilterTabGroup'

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
    if (!confirm('Remove this file from your workspace?')) return
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

  const statusMessage = loading
    ? 'Loading storage and files.'
    : loadError
      ? loadError
      : null

  return (
    <AssetsPageFrame statusMessage={statusMessage} statusRole={loadError ? 'alert' : 'status'}>
      <AssetsMotionRoot className="assets-page page-shell">
      <header className="assets-hero ui-hero-row page-header">
        <div className="ui-hero-row__main page-header__main">
          <h1 className="page-header__title">
            <span className="page-header__title-accent">Files</span>
          </h1>
          <p className="page-header__desc">
            Upload files, save links, and organize folders. Storage usage follows your plan tier.
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

      <nav className="assets-breadcrumb" aria-label="Folder path">
        <button
          type="button"
          className={normCurrent === '/' ? 'active' : ''}
          onClick={() => setCurrentFolder('/')}
          aria-current={normCurrent === '/' ? 'location' : undefined}
        >
          Root
        </button>
        {breadcrumbParts.map((segment, i) => {
          const path = '/' + breadcrumbParts.slice(0, i + 1).join('/')
          const isLast = i === breadcrumbParts.length - 1
          return (
            <span key={path} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ChevronRight size={14} style={{ opacity: 0.35 }} aria-hidden />
              <button
                type="button"
                className={isLast ? 'active' : ''}
                onClick={() => setCurrentFolder(path)}
                aria-current={isLast ? 'location' : undefined}
              >
                {segment}
              </button>
            </span>
          )
        })}
      </nav>

      <div className="assets-toolbar">
        <FilterTabGroup
          label="Filter files by type"
          options={['all', 'file', 'link'] as const}
          value={filter}
          onChange={setFilter}
        />
        <div className="assets-toolbar__actions">
          <button
            type="button"
            className="btn btn-secondary assets-toolbar__btn"
            onClick={() => setShowFolderModal(true)}
          >
            <FolderPlus size={16} aria-hidden /> New folder
          </button>
          <button type="button" className="btn btn-primary assets-toolbar__btn" onClick={() => setShowUploadModal(true)}>
            <Plus size={18} aria-hidden /> Add file
          </button>
        </div>
      </div>

      {loadError && !loading ? (
        <div className="assets-empty ui-panel ui-panel--dashed" role="alert">
          <AlertCircle size={40} style={{ margin: '0 auto 1rem', color: '#ef4444' }} aria-hidden />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontWeight: 900 }}>Could not load files</h3>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--text-sub)', fontWeight: 600 }}>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void fetchAssets()}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="assets-loading" role="status" aria-busy="true" aria-label="Loading files and folders">
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--brand)', margin: '0 auto' }} aria-hidden />
          <span className="sr-only">Loading storage and files</span>
        </div>
      ) : (
        <div id="assets-filter-panel" role="tabpanel" aria-label="Filtered files">
          {childFolders.length > 0 && (
            <div className="assets-grid assets-grid--folders" style={{ marginBottom: '1.25rem' }}>
              {childFolders.map(({ path, name }) => (
                <button
                  key={path}
                  type="button"
                  className="assets-folder-tile ui-panel ui-panel--compact"
                  onClick={() => setCurrentFolder(path)}
                  aria-label={`Open folder ${name}`}
                >
                  <Folder size={28} color="var(--brand)" aria-hidden />
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
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontWeight: 900 }}>No files in this folder</h3>
              <p style={{ margin: '0 0 1.25rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                Create a folder or upload a file or link to get started.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFolderModal(true)}>
                  New folder
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                  Add file
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
        </div>
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
      </AssetsMotionRoot>
    </AssetsPageFrame>
  )
}
