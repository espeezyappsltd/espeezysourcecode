'use client'

import React, { useState } from 'react'
import { Camera, AlertTriangle, Loader2 } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'
import { ListingCondition } from '@/types/marketplace'
import { MAX_ASSET_CREDIT_VALUE, formatCreditCapHint } from '@/lib/credits'

interface PostListingModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function PostListingModal({ onClose, onSuccess }: PostListingModalProps) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [category, setCategory] = useState('Electronics')
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState<ListingCondition>('Used')
  const [meetupZone, setMeetupZone] = useState('Library')
  const [meetupDetails, setMeetupDetails] = useState('')
  const [duration, setDuration] = useState(14)
  const [images, setImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const { addToast } = useNotifications()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 5))
    }
  }

  const handlePost = async () => {
    if (!agreed) {
      addToast('Policy required', 'Confirm the marketplace policy to publish.', 'warning')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('price', price)
      formData.append('category', category)
      formData.append('quantity', String(quantity))
      formData.append('condition', condition)
      formData.append('meetup_zone', meetupZone)
      formData.append('meetup_details', meetupDetails)
      formData.append('duration_days', String(duration))
      images.forEach((img) => formData.append('images', img))

      const res = await fetch('/api/marketplace/listings', { method: 'POST', credentials: 'include', body: formData })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      addToast('Listed', 'Item is live. Buyers pay with Espeezy credits.', 'success')
      onSuccess()
    } catch (err: unknown) {
      addToast('Upload failed', err instanceof Error ? err.message : 'Unknown error', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div role="presentation" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontWeight: 950 }}>List item</h2>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-sub)' }}>Espeezy credits checkout only · step {step}/2</p>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input className="form-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea className="form-input" placeholder="Description (min 10 chars)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {['Electronics', 'Textbooks', 'Lab Equipment', 'Stationery', 'Hardware', 'Other'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select className="form-input" value={condition} onChange={(e) => setCondition(e.target.value as ListingCondition)}>
                  <option>New</option>
                  <option>Like New</option>
                  <option>Used</option>
                  <option>Refurbished</option>
                </select>
              </div>
              <input className="form-input" type="number" min={0} max={MAX_ASSET_CREDIT_VALUE} placeholder="Price in credits" value={price} onChange={(e) => setPrice(e.target.value)} />
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-sub)' }}>{formatCreditCapHint()}</p>
              <select className="form-input" value={meetupZone} onChange={(e) => setMeetupZone(e.target.value)}>
                <option>Library</option>
                <option>Student Union</option>
                <option>Science Hub</option>
                <option>Cafeteria</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0.75rem', border: '2px dashed var(--border)', borderRadius: 12 }}>
                <Camera size={18} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Add photos ({images.length}/5)</span>
                <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <AlertTriangle style={{ margin: '0 auto 0.5rem' }} />
              <label style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span style={{ fontWeight: 700 }}>I agree to marketplace policy</span>
              </label>
            </div>
          )}
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-secondary" onClick={() => (step > 1 ? setStep(1) : onClose())}>{step === 1 ? 'Cancel' : 'Back'}</button>
          {step === 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>Continue</button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={uploading} onClick={() => void handlePost()}>
              {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Publish'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
