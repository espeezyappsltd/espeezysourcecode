'use client'

import React, { useState } from 'react'
import { 
  Camera, 
  DollarSign, 
  AlertTriangle, 
  Loader2,
  Plus
} from 'lucide-react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { useNotifications } from '@/components/NotificationProvider'
import { listingSchema } from '@/utils/validation'
import { ListingCondition, PaymentMethod } from '@/types/marketplace'

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
  const [duration, setDuration] = useState(7)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'BOTH'>('BOTH')
  const [images, setImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const db = createBrowserSupabaseClient()
  const { addToast } = useNotifications()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setImages(prev => [...prev, ...newFiles].slice(0, 5))
    }
  }

  const handlePost = async () => {
    if (!agreed) {
      addToast('Authorization Required', 'You must agree to the institutional policy before publishing a listing.', 'warning')
      return
    }
    setUploading(true)
    
    try {
      // VALIDATION
      listingSchema.parse({
        title,
        description,
        price: parseFloat(price),
        category,
        quantity,
        condition,
        images: ['placeholder'],
        location: meetupZone,
        meetup_zone: meetupZone,
        meetup_details: meetupDetails,
        duration_days: duration,
        payment_method: paymentMethod,
      })

      const { data: { user } } = await db.auth.getUser()
      if (!user) throw new Error('Auth required')

      const uploadedPaths: string[] = []
      for (const img of images) {
        const ext = img.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`
        const { error: upErr } = await db.storage.from('marketplace').upload(path, img)
        if (!upErr) uploadedPaths.push(path)
      }

      const { error } = await db.from('marketplace_listings').insert({
        owner_id: user.id,
        title,
        description,
        price: parseFloat(price),
        is_free: parseFloat(price) === 0,
        category,
        quantity,
        condition,
        images: uploadedPaths,
        meetup_zone: meetupZone,
        meetup_details: meetupDetails,
        duration_days: duration,
        payment_method: paymentMethod,
        status: 'AVAILABLE'
      })

      if (error) throw error
      addToast('Listing Created', 'Your resource is now visible to the institutional graph.', 'success')
      onSuccess()
    } catch (err: unknown) {
      addToast('Upload Failed', (err instanceof Error ? err.message : 'Unknown error'), 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} onClick={onClose} />
      
      <div className="page-fade" style={{ 
        width: '100%', 
        maxWidth: '550px', 
        background: 'var(--surface)', 
        borderRadius: '28px', 
        overflow: 'hidden', 
        position: 'relative',
        boxShadow: 'var(--shadow-2xl)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0 }}>List New Resource</h2>
          <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', background: 'rgba(var(--brand-rgb), 0.1)', padding: '4px 10px', borderRadius: '10px' }}>
            STEP {step} / 3
          </div>
        </div>

        <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {step === 1 && (
            <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Resource Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Psychology Textbook, Graphing Calculator..."
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                  >
                    {['Electronics', 'Textbooks', 'Lab Equipment', 'Stationery', 'Hardware', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Condition</label>
                  <select 
                    value={condition}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCondition(e.target.value as ListingCondition)}
                    style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Visual Evidence ({images.length}/5)</label>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                    {images.map((img, i) => (
                      <div key={i} style={{ aspectRatio: '1/1', background: 'var(--bg-sub)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                        <img src={URL.createObjectURL(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Selected preview" />
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label style={{ aspectRatio: '1/1', background: 'var(--bg-sub)', border: '2px dashed var(--border)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Camera size={24} className="text-sub" />
                        <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
                      </label>
                    )}
                 </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Condition & Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the condition, version, or any specific details..."
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none', resize: 'none' }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Price ($)</label>
                    <div style={{ position: 'relative' }}>
                       <DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
                       <input 
                         type="number" 
                         value={price}
                         onChange={(e) => setPrice(e.target.value)}
                         style={{ width: '100%', padding: '0.9rem 0.9rem 0.9rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                       />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Quantity / Stock</label>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      min={1}
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Max Duration (Days)</label>
                    <input 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                    />
                  </div>
               </div>

               <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Academic Safe Zone</label>
                 <select 
                   value={meetupZone}
                   onChange={(e) => setMeetupZone(e.target.value)}
                   style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none', appearance: 'none' }}
                 >
                   <option>Library</option>
                   <option>Student Union</option>
                   <option>Science Hub</option>
                   <option>Cafeteria</option>
                   <option>Custom Location</option>
                 </select>
               </div>
               
               <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Meetup Details</label>
                  <input 
                    type="text" 
                    value={meetupDetails}
                    onChange={(e) => setMeetupDetails(e.target.value)}
                    placeholder="e.g. Near the main entrance, 2nd floor study area..."
                    style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                  />
               </div>

               <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Accepted Payments</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                     {['CASH', 'STRIPE', 'BOTH'].map(m => (
                       <button 
                         key={m} 
                         type="button"
                         onClick={() => setPaymentMethod(m as PaymentMethod | 'BOTH')}
                         style={{ 
                           padding: '0.75rem', 
                           borderRadius: '10px', 
                           border: '1px solid var(--border)', 
                           background: paymentMethod === m ? 'var(--brand)' : 'var(--bg-sub)',
                           color: paymentMethod === m ? 'white' : 'var(--text-sub)',
                           fontSize: '0.7rem',
                           fontWeight: 800
                         }}
                       >
                         {m}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'center' }}>
               <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '2px dashed rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle className="text-error" size={40} style={{ margin: '0 auto', marginBottom: '1.5rem' }} />
                  <h3 style={{ fontWeight: 950, color: 'var(--error)' }}>LEGAL & POLICY ALERT</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.6, marginTop: '1rem' }}>
                    Trading prohibited substances, dangerous hardware, or copyrighted materials is an institutional violation. 
                    Your account and listing will be immediately logged for human review if reported. 
                    Illegal activities will be forwarded to student conduct boards.
                  </p>
               </div>
               
               <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--brand)' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>I strictly adhere to these policies.</span>
               </label>
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 800, border: '1px solid var(--border)' }}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button 
            onClick={() => step < 3 ? setStep(s => s + 1) : handlePost()}
            className="btn btn-primary"
            disabled={uploading}
            style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 900, minWidth: '120px' }}
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : step === 3 ? 'Finalize Post' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
