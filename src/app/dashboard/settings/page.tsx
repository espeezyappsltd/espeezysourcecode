'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { db, auth, storage } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  addDoc
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage'
import {
  Settings, Save, CheckCircle2, Shield, Trash2,
  Key, AlertTriangle, X, Palette as PaletteIcon,
  Image as ImageIcon, User, MapPin,
  UserMinus, Eye, ShieldAlert, Activity as PulseIcon, History, Mail,
  Calendar, CreditCard, ArrowUpRight, Award, Sparkles, Lock, Search, MessageSquare, Phone, Globe
} from 'lucide-react'
import { detectCountry, getFlagComponent } from '@/utils/geo'
import ActiveUsersList from '@/components/ActiveUsersList'
import ActivityLogView from '@/components/ActivityLogView'
import EmailCenter from '@/components/EmailCenter'
import TransientError from '@/components/TransientError'
import imageCompression from 'browser-image-compression'
import { useTheme, PALETTES } from '@/context/ThemeContext'
import { kickUser } from '../join/actions'
import { logActivity } from '@/utils/logging'
import { TabName } from '@/types/ui'
import { Profile } from '@/types/auth'
import { Group, Achievement } from '@/types/database'
import { useNotifications } from '@/components/NotificationProvider'
import { useProfile } from '@/context/ProfileContext'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabName>('identity')
  const { profile, refreshProfile, setProfile } = useProfile()
  const [fullName, setFullName] = useState('')
  const [courseName, setCourseName] = useState('')
  const [enrollmentYear, setEnrollmentYear] = useState<number>(new Date().getFullYear())
  const [completionYear, setCompletionYear] = useState<number>(new Date().getFullYear() + 3)
  const [rank, setRank] = useState('Senior')
  const [tagline, setTagline] = useState('')
  const [biography, setBiography] = useState('')
  const [stack, setStack] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('')

  const { currentPalette, setPalette, customBg, setCustomBg } = useTheme()
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)

  const { addToast } = useNotifications()

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [groupSearch, setGroupSearch] = useState('')
  const [switching, setSwitching] = useState(false)

  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [updatingGroup, setUpdatingGroup] = useState(false)
  const [customToolInput, setCustomToolInput] = useState('')
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[] | null>(null)
  const [saveConfirmation, setSaveConfirmation] = useState(false)
  const [saving, setSaving] = useState(false)

  // Feedback State
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('Suggestion')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<string[]>([])
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [isGithubLinked, setIsGithubLinked] = useState(false)
  const [isGoogleLinked, setIsGoogleLinked] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpStep, setOtpStep] = useState<'idle' | 'sent' | 'verifying'>('idle')
  const [protectAvatar, setProtectAvatar] = useState(false)
  const [isToasterMode, setIsToasterMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('gf_toaster_mode') === 'true'
  })

  const getErrorMessage = (err: unknown, fallback = 'Something went wrong') => {
    if (err instanceof Error) return err.message
    return fallback
  }

  useEffect(() => {
    if (isToasterMode) document.body.classList.add('toaster-mode')
    else document.body.classList.remove('toaster-mode')
  }, [isToasterMode])

  const fetchGroups = useCallback(async () => {
    const q = query(collection(db, 'groups'), orderBy('name'))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Group))
    setAvailableGroups(data)
  }, [])

  const fetchJoinRequests = useCallback(async (userId: string) => {
    const q = query(
      collection(db, 'messages'),
      where('user_id', '==', userId)
    )
    const snap = await getDocs(q)
    const requests = snap.docs
      .map(d => d.data())
      .filter((m: any) => m.content?.includes('[JOIN REQUEST]'))
      .map((m: any) => m.group_id)

    setSentRequests(Array.from(new Set(requests)))
  }, [])

  const fetchTeam = useCallback(async (groupId: string) => {
    const q = query(collection(db, 'profiles'), where('group_id', '==', groupId))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Profile))
    setTeamMembers(data)
  }, [])

  const fetchUserData = useCallback(async () => {
    const user = auth.currentUser
    if (user) {
      // 1. Meta-Information (Linked Identities)
      const providers = user.providerData || []
      setIsGithubLinked(providers.some(p => p.providerId === 'github.com'))
      setIsGoogleLinked(providers.some(p => p.providerId === 'google.com'))

      // 2. Profile and Dependent Data
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid))
      
      if (profileSnap.exists()) {
        const data = profileSnap.data()
        setFullName(data.full_name || '')
        setCourseName(data.course_name || '')
        setEnrollmentYear(data.enrollment_year || new Date().getFullYear())
        setCompletionYear(data.completion_year || new Date().getFullYear() + 3)
        setRank(data.rank || 'Senior')
        setTagline(data.tagline || '')
        setBiography(data.biography || '')
        setStack(data.stack || '')
        setAvatarUrl(data.avatar_url || '')
        setPhoneNumber(data.phone_number || '')
        setCountryCode(data.country_code || '')
        setProtectAvatar(data.protect_avatar || false)
        setIsPhoneVerified(data.is_phone_verified || false)
        
        // Fetch group if exists
        let groupData = null
        if (data.group_id) {
          const groupSnap = await getDoc(doc(db, 'groups', data.group_id))
          groupData = groupSnap.exists() ? groupSnap.data() : null
          setIsEncrypted(groupData?.is_encrypted || false)
        }

        // Parallelize Secondary Context Fetches
        const contextFetches = []
        contextFetches.push(fetchJoinRequests(user.uid))
        if (data.group_id) contextFetches.push(fetchTeam(data.group_id))
        
        await Promise.all(contextFetches)
        
        setProfile({ id: profileSnap.id, ...data, groups: groupData } as unknown as Profile)
      }
    }
    setLoading(false)
  }, [fetchJoinRequests, fetchTeam, setProfile])

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchUserData(), fetchGroups()])
    }
    void initializeData()
  }, [fetchUserData, fetchGroups])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const biographyWords = biography.trim() ? biography.trim().split(/\s+/).filter(Boolean).length : 0

    if (!fullName.trim()) {
      setError('Identity Verification Blocked: Full Name is mandatory for node assignment.')
      setSaving(false)
      return
    }

    if (biographyWords > 500) {
      setError('Identity Protocol Failure: Performance Summary exceeds the 500-word limit.')
      setSaving(false)
      return
    }

    setSaving(true)
    setError(null)

    if (!profile) return

    try {
      await updateDoc(doc(db, 'profiles', profile.id), {
        full_name: fullName,
        course_name: courseName,
        enrollment_year: enrollmentYear ? Number(enrollmentYear) : null,
        completion_year: completionYear ? Number(completionYear) : null,
        rank: rank,
        tagline: tagline,
        biography: biography,
        stack: stack,
        phone_number: phoneNumber,
        country_code: countryCode
      })

      // Verifiable Logging
      if (profile.id) {
        logActivity(profile.id, profile.group_id || '', 'setting_updated', 'Updated profile and school info')
      }
      refreshProfile()
      addToast('Profile Synchronized', 'Your academic journey and identity details have been successfully updated.', 'success')
    } catch (err: any) {
      setError(`Identity Sync Error: ${err.message || 'Verification failed'}`)
    }
    setSaving(false)
  }

  const handleCheckout = async (plan: 'pro' | 'premium') => {
    setError(null)
    setSwitching(true)
    
    if (!profile?.id) {
      setError('Identity context missing. Please refresh and try again.')
      setSwitching(false)
      return
    }

    if (plan === 'pro') {
      window.location.href = `https://buy.stripe.com/5kQcN5clSbLa5CU0f67wA04?client_reference_id=${profile.id}`
      return
    }

    if (plan === 'premium') {
      window.location.href = `https://buy.stripe.com/00wcN55Xu16w4yQe5W7wA06?client_reference_id=${profile.id}`
      return
    }
  }

  const handleRequestOtp = async () => {
    if (!phoneNumber) {
      setError("Please enter a phone number first.")
      return
    }
    // Firebase Phone Auth requires recaptcha, complex in a one-off settings page migration
    // For now, we'll mark it as 'not supported directly in this view yet' or keep the placeholder
    addToast('Info', 'Phone verification is currently handled via specialized gateways.', 'info')
  }

  const handleVerifyOtp = async () => {
    // Placeholder for consistency
  }

  const handleToggleAvatarProtection = async (val: boolean) => {
    setProtectAvatar(val)
    if (!profile) return
    try {
      await updateDoc(doc(db, 'profiles', profile.id), { protect_avatar: val })
      addToast('Protection Updated', val ? 'Manual avatar locked.' : 'Provider sync enabled.', 'success')
    } catch (err: any) {
      addToast('Protocol Error', 'Failed to update protection status.', 'error')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'bg') => {
    try {
      const file = e.target.files?.[0]
      if (!file || !profile) return

      if (type === 'avatar') setUploadingAvatar(true)
      else setUploadingBg(true)

      setError(null)
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true })
      const fileName = `${profile.id}-${type}-${Date.now()}.jpg`
      const storageRef = ref(storage, `Espeezy_assets/${fileName}`)

      await uploadBytes(storageRef, compressedFile)
      const publicUrl = await getDownloadURL(storageRef)

      if (type === 'avatar') {
        const updateData: any = { avatar_url: publicUrl, manual_avatar_url: publicUrl }
        await updateDoc(doc(db, 'profiles', profile.id), updateData)
        setAvatarUrl(publicUrl)
      } else {
        await setCustomBg(publicUrl)
      }
      refreshProfile()
      addToast('Visuals Updated', 'Your appearance settings have been synchronized across all project hubs.', 'success')
    } catch (err: unknown) {
      setError(`Upload failed: ${getErrorMessage(err, 'unknown upload error')}`)
    } finally {
      setUploadingAvatar(false)
      setUploadingBg(false)
    }
  }

  const handleToggleEncryption = async () => {
    if (!profile?.group_id) return
    setUpdatingGroup(true)
    const nextValue = !isEncrypted

    try {
      await updateDoc(doc(db, 'groups', profile.group_id), { is_encrypted: nextValue })
      
      // Verifiable Logging
      if (profile.id && profile.group_id) {
        logActivity(
          profile.id,
          profile.group_id,
          'privacy_toggled',
          `Changed group visibility to ${nextValue ? 'Encrypted' : 'Public'}`
        )
      }
      setIsEncrypted(nextValue)
      addToast('Visibility Changed', `Group visibility is now set to ${nextValue ? 'Encrypted' : 'Public'}.`, 'success')
    } catch (err: any) {
      setError(`Failed to update visibility: ${err.message}`)
    }
    setUpdatingGroup(false)
  }

  const handleLinkIdentity = async (provider: 'github.com' | 'google.com') => {
    setSaving(true)
    setError(null)
    // Firebase linkage requires a more complex flow (re-auth or popup)
    addToast('Info', 'Identity linkage is managed during the secure login sequence.', 'info')
    setSaving(false)
  }

  const handleKickUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team? They will lose access to all tasks and chat.')) return

    const res = await kickUser(userId)
    if (res.error) {
      setError(res.error)
    } else {
      setTeamMembers(prev => prev.filter(m => m.id !== userId))
      addToast('Member Removed', 'The specialist has been safely removed from the group registry.', 'success')
    }
  }

  const handleDownloadData = () => window.open('/api/account', '_blank')

  const handleSwitchGroup = async (newGroupId: string | null) => {
    if (!profile) return
    setSwitching(true)
    setError(null)

    try {
      await updateDoc(doc(db, 'profiles', profile.id), { group_id: newGroupId, role: 'collaborator' })
      await fetchUserData()
      refreshProfile()
      addToast('Team Switched', 'You have been successfully re-assigned to the new project group.', 'success')
    } catch (err: any) {
      setError(`Sync failed: ${err.message}`)
    }
    setSwitching(false)
  }

  const handleAccountTermination = async () => {
    if (deleteConfirmation !== 'DELETE') return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Account termination failed')
      await auth.signOut()
      window.location.href = '/login'
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Account termination failed'))
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPortal(true)
    setError(null)
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Portal creation failed')
      window.location.href = result.url
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to open billing portal'))
      setLoadingPortal(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-sub)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--brand)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  const isAdmin = profile?.role?.toLowerCase() === 'admin'

  return (
    <div className="page-fade" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 var(--p-safe)' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div style={{ padding: '8px', background: 'var(--brand)', borderRadius: '12px' }}>
          <Settings size={28} color="white" />
        </div>
        <h1 className="fluid-h1" style={{ margin: 0, fontWeight: 900 }}>Settings</h1>
      </div>

      {error && <TransientError message={error} />}

      {/* Tab Navigation */}
      <div className="scroll-x-allowed" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '1px solid var(--border)', 
        marginBottom: '2.5rem', 
        overflowX: 'auto', 
        paddingBottom: '0.75rem',
        marginLeft: 'calc(var(--p-safe) * -1)',
        marginRight: 'calc(var(--p-safe) * -1)',
        paddingLeft: 'var(--p-safe)',
        paddingRight: 'var(--p-safe)',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'identity', label: 'Personal Identity', icon: User },
          { id: 'identity_hub', label: 'Identity Hub', icon: ShieldAlert },
          { id: 'pulse', label: 'Presence', icon: PulseIcon },
          { id: 'activity', label: 'Activity Log', icon: History },
          { id: 'intercom', label: 'Mail', icon: Mail },
          { id: 'team', label: 'Admin', icon: Shield, hidden: !isAdmin },
          { id: 'workspace', label: 'Workspace', icon: MapPin },
          { id: 'appearance', label: 'Design', icon: PaletteIcon },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'billing', label: 'Go Pro', icon: CreditCard },
          { id: 'data', label: 'Privacy', icon: AlertTriangle },
          { id: 'support', label: 'Feedback', icon: MessageSquare },
        ].filter(t => !t.hidden).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabName)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
              background: activeTab === tab.id ? 'var(--brand)' : 'var(--bg-sub)',
              color: activeTab === tab.id ? 'white' : 'var(--text-sub)',
              border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
              transition: 'all 0.2s ease', whiteSpace: 'nowrap', fontSize: '0.8rem'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div style={{ minHeight: '400px' }}>
      
        {activeTab === 'support' && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Send Feedback</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>Tell us how we can make Espeezy better for your team.</p>
            
            {feedbackSuccess ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(var(--brand-rgb), 0.05)', borderRadius: '24px', border: '1px dashed var(--brand)' }}>
                <div style={{ width: '60px', height: '60px', background: 'var(--brand)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Thank you!</h3>
                <p style={{ color: 'var(--text-sub)', marginTop: '0.5rem' }}>Your feedback has been received and will be reviewed by our team.</p>
                <button 
                  onClick={() => { setFeedbackSuccess(false); setFeedbackMessage(''); }} 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1.5rem', width: 'auto' }}
                >
                  Send more feedback
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input" 
                    value={feedbackCategory} 
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    style={{ background: 'var(--bg-sub)' }}
                  >
                    <option>Suggestion</option>
                    <option>Bug Report</option>
                    <option>General Comment</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '150px', background: 'var(--bg-sub)', resize: 'vertical' }}
                    placeholder="What's on your mind?"
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                  />
                </div>
                
                <button 
                  className="btn btn-primary" 
                  disabled={submittingFeedback || !feedbackMessage.trim()}
                  onClick={async () => {
                    setSubmittingFeedback(true)
                    try {
                      await addDoc(collection(db, 'user_feedback'), {
                        user_id: profile?.id,
                        message: feedbackMessage,
                        category: feedbackCategory,
                        created_at: new Date().toISOString()
                      })
                      
                      setFeedbackSuccess(true)
                      addToast('Feedback Received', 'Thank you for your input!', 'success')
                      
                      if (profile) {
                        logActivity(profile.id, profile.group_id || 'system', 'setting_updated', `Submitted feedback: ${feedbackCategory}`, { category: feedbackCategory })
                      }
                    } catch (err: unknown) {
                      addToast('Submission Failed', getErrorMessage(err), 'error')
                    } finally {
                      setSubmittingFeedback(false)
                    }
                  }}
                >
                  {submittingFeedback ? 'Sending...' : 'Submit Feedback'}
                </button>
              </div>
            )}
          </div>
        )}
      
        {activeTab === 'billing' && profile && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Subscription & Billing</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>Manage your project support plan and billing details.</p>
            
            <div style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(var(--brand-rgb), 0.03)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                   <div style={{ padding: '8px', background: 'var(--brand)', borderRadius: '10px', color: 'white' }}>
                      <CreditCard size={20} />
                   </div>
                   <h3 style={{ margin: 0, fontWeight: 900 }}>{profile.subscription_plan === 'premium' ? 'Premium Lifetime' : profile.subscription_plan === 'pro' ? 'Pro Monthly' : 'Standard Free'}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                  {profile.subscription_plan 
                    ? `Active since ${new Date(profile.subscription_started_at || '1970-01-01').toLocaleDateString()}` 
                    : 'Unlock professional project features.'}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {profile.subscription_plan ? (
                  <button 
                    onClick={handleManageSubscription}
                    disabled={loadingPortal}
                    className="btn btn-primary" 
                    style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {loadingPortal ? 'Opening...' : 'Manage Billing'}
                    <ArrowUpRight size={16} />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => handleCheckout('pro')} disabled={switching} className="btn btn-primary" style={{ width: 'auto' }}>
                      {switching ? 'Connecting...' : 'Try Pro'}
                    </button>
                    <button onClick={() => handleCheckout('premium')} disabled={switching} className="btn btn-secondary" style={{ width: 'auto' }}>
                      {switching ? 'Connecting...' : 'Go Premium'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!profile.subscription_plan && (
              <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(var(--brand-rgb), 0.05)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} color="var(--brand)" /> Pro Support</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '1rem' }}>Unlock advanced team analytics and exclusive Pro themes for £2.99/mo.</p>
                  <button onClick={() => handleCheckout('pro')} disabled={switching} className="btn btn-sm btn-primary">Select Pro</button>
                </div>
                <div style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid #d4af37' }}>
                  <h4 style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d4af37' }}><Sparkles size={18} /> Premium Partner</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '1rem' }}>The ultimate mission experience with luxury themes and lifetime access.</p>
                  <button onClick={() => handleCheckout('premium')} disabled={switching} className="btn btn-sm btn-primary shimmer-gold" style={{ background: '#d4af37' }}>Go Premium</button>
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'intercom' && profile && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Direct Intercom & Mail</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>Management hub for automated reminders and verifiable PDF reports.</p>
            <EmailCenter groupId={profile.group_id || ''} profile={profile} teamMembers={teamMembers} />
          </div>
        )}

        {activeTab === 'activity' && profile && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Activity Log</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>A complete history of your account actions and project updates.</p>
            <ActivityLogView userId={profile.id} />
          </div>
        )}

        {activeTab === 'pulse' && profile?.group_id && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Live Team Activity</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>Real-time awareness of your collaborators and recently seen members.</p>
            <ActiveUsersList groupId={profile.group_id} currentUser={profile} />
          </div>
        )}

        {activeTab === 'identity_hub' && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldAlert size={28} className="text-brand" />
                Identity Hub
              </h2>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>Manage your technical credentials, secure your profile data, and sync with professional providers.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              
              {/* Profile Protection Mode */}
              <div style={{ background: protectAvatar ? 'rgba(var(--brand-rgb), 0.03)' : 'var(--bg-sub)', border: protectAvatar ? '2px solid var(--brand)' : '1px solid var(--border)', borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: '0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: protectAvatar ? 'var(--brand)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: protectAvatar ? 'white' : 'var(--text-sub)' }}>
                    {protectAvatar ? <Lock size={22} /> : <Shield size={22} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850 }}>Profile Protection</h3>
                    <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.7rem' }}>{protectAvatar ? 'Manual photo locked.' : 'Provider sync enabled.'}</p>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 800, color: protectAvatar ? 'var(--brand)' : 'var(--text-sub)' }}>{protectAvatar ? 'PRIORITY_ACTIVE' : 'SYNC_ENABLED'}</span>
                   <button 
                    onClick={() => handleToggleAvatarProtection(!protectAvatar)}
                    className={protectAvatar ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"}
                    style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}
                   >
                     {protectAvatar ? 'Unlock' : 'Lock Avatar'}
                   </button>
                </div>
              </div>

              {/* GitHub Identity */}
              <div style={{ background: isGithubLinked ? 'rgba(34, 197, 94, 0.03)' : 'var(--bg-sub)', border: isGithubLinked ? '1px solid var(--success)' : '1px solid var(--border)', borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <PulseIcon size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850 }}>GitHub Identity</h3>
                    <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.7rem' }}>Technical archives sync.</p>
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   {isGithubLinked ? (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 900, fontSize: '0.7rem' }}>
                        <CheckCircle2 size={14} /> CONNECTED
                     </div>
                   ) : (
                     <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-sub)' }}>Disconnected</span>
                   )}
                   {!isGithubLinked && (
                     <button onClick={() => handleLinkIdentity('github.com')} className="btn btn-sm btn-primary" style={{ width: 'auto' }}>Link</button>
                   )}
                </div>
              </div>

              {/* Phone OTP Connection */}
              <div style={{ background: isPhoneVerified ? 'rgba(34, 197, 94, 0.03)' : 'var(--bg-sub)', border: isPhoneVerified ? '1px solid var(--success)' : '1px solid var(--border)', borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850 }}>Phone Protocol</h3>
                    <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.7rem' }}>SMS Verification</p>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                   {!isPhoneVerified && otpStep === 'idle' && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <input 
                          type="tel" 
                          className="form-input" 
                          placeholder="+1 555 000 0000" 
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        />
                        <button onClick={handleRequestOtp} className="btn btn-sm btn-primary" style={{ width: '100%' }}>Send Code</button>
                     </div>
                   )}

                   {!isPhoneVerified && (otpStep === 'sent' || otpStep === 'verifying') && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Code" 
                          value={otp} 
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1rem', fontWeight: 900 }}
                        />
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => setOtpStep('idle')} className="btn btn-sm btn-secondary" style={{ flex: 1 }}>Back</button>
                          <button onClick={handleVerifyOtp} disabled={otpStep === 'verifying' || otp.length < 6} className="btn btn-sm btn-primary" style={{ flex: 2 }}>
                            {otpStep === 'verifying' ? '...' : 'Verify'}
                          </button>
                        </div>
                     </div>
                   )}

                   {isPhoneVerified && (
                     <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 900, marginBottom: '0.25rem', justifyContent: 'center', fontSize: '0.8rem' }}>
                           <CheckCircle2 size={18} /> VERIFIED
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{phoneNumber}</div>
                     </div>
                   )}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'identity' && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={24} className="text-brand" />
              Profile Identity
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 'var(--avatar-size)', height: 'var(--avatar-size)' }}>
                {/* PREMIUM AVATAR FRAME (NEW) */}
                <div style={{ 
                  position: 'absolute', 
                  inset: '-4px', 
                  borderRadius: '50%', 
                  background: (profile?.subscription_plan === 'lifetime' || profile?.subscription_plan === 'premium') 
                    ? 'linear-gradient(45deg, #d4af37, #ffdf00, #d4af37)' 
                    : profile?.subscription_plan === 'pro' 
                      ? 'linear-gradient(45deg, var(--brand), #6366f1)'
                      : 'transparent',
                  animation: (profile?.subscription_plan && profile.subscription_plan !== 'free') ? 'spin 3s linear infinite' : 'none',
                  opacity: (profile?.subscription_plan && profile.subscription_plan !== 'free') ? 1 : 0,
                  zIndex: 0
                }} />
                
                <div style={{ 
                  position: 'relative',
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%', 
                  background: 'var(--bg-sub)', 
                  border: '2px solid var(--border)', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  zIndex: 1
                }}>
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Profile avatar" fill sizes="120px" style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <User size={32} color="var(--text-sub)" />
                  )}
                </div>
                
                {/* TIER BADGE SELLING POINTS (NEW) */}
                {profile?.subscription_plan && profile.subscription_plan !== 'free' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    background: profile.subscription_plan === 'lifetime' ? 'linear-gradient(135deg, #d4af37 0%, #ffdf00 100%)' : 'var(--brand)',
                    color: profile.subscription_plan === 'lifetime' ? 'black' : 'white',
                    padding: '4px 12px',
                    borderRadius: '100px',
                    fontSize: '0.65rem',
                    fontWeight: 950,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                    filter: profile.subscription_plan === 'lifetime' ? 'url(#glow-gold)' : 'url(#elite-shimmer)',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                    <Sparkles size={12} />
                    {profile.subscription_plan === 'lifetime' ? 'FOUNDER ACCESS' : profile.subscription_plan === 'premium' ? 'ELITE SCHOLAR' : 'PRO MEMBER'}
                  </div>
                )}

                <label style={{ position: 'absolute', bottom: '0', right: '0', minWidth: '110px', padding: '0.6rem 0.9rem', borderRadius: '18px', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)', border: '2px solid var(--surface)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.01em', zIndex: 3 }}>
                  Upload Photo
                  <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'avatar')} style={{ display: 'none' }} />
                </label>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Profile Photo</h3>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Update your professional identity.</p>
                {uploadingAvatar && <p style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 800, marginTop: '0.4rem' }}>Optimizing...</p>}
                
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                  <button 
                    onClick={() => handleToggleAvatarProtection(!protectAvatar)}
                    style={{ 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      background: protectAvatar ? 'rgba(var(--brand-rgb), 0.1)' : 'var(--bg-sub)', 
                      border: '1px solid var(--border)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: protectAvatar ? 'var(--brand)' : 'var(--text-sub)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                  >
                    {protectAvatar ? <Lock size={12} /> : <Shield size={12} />}
                    {protectAvatar ? 'Profile Protection: ACTIVE' : 'Enable Profile Protection'}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--gap-md)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Degree/Course</label>
                  <input type="text" className="form-input" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="e.g. Computer Science" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Achievement Rank</label>
                  <input type="text" className="form-input" value={rank} onChange={e => setRank(e.target.value)} placeholder="e.g. Senior" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--gap-md)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number (International)</label>
                  <div style={{ position: 'relative' }}>
                     <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
                     <input 
                      type="tel" 
                      className="form-input" 
                      value={phoneNumber} 
                      onChange={e => {
                        setPhoneNumber(e.target.value)
                        const detected = detectCountry(e.target.value)
                        if (detected) setCountryCode(detected)
                      }} 
                      placeholder="+1 555 000 0000" 
                      style={{ paddingLeft: '3rem' }}
                     />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Country Flag</label>
                  <div style={{ position: 'relative' }}>
                     <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '16px' }}>
                        {(() => {
                           const Flag = getFlagComponent(countryCode)
                           return Flag ? <Flag /> : <Globe size={18} color="var(--text-sub)" />
                        })()}
                     </div>
                     <input 
                      type="text" 
                      className="form-input" 
                      value={countryCode} 
                      onChange={e => setCountryCode(e.target.value.toUpperCase().substring(0,2))} 
                      placeholder="US, GB, KE..." 
                      style={{ paddingLeft: '3rem' }}
                     />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tagline / Preferred Title</label>
                  <input type="text" className="form-input" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Research Lead, PhD Candidate" />
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-sub)' }}>This appears on your profile and public scholar card.</p>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Professional Biography</label>
                  <textarea
                    className="form-input"
                    value={biography}
                    onChange={e => setBiography(e.target.value)}
                    rows={6}
                    placeholder="Write up to 500 words about your research focus, experience, and goals."
                    style={{ resize: 'vertical', minHeight: '140px' }}
                  />
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: biography.trim().split(/\s+/).filter(Boolean).length > 500 ? 'var(--error)' : 'var(--text-sub)' }}>
                      {biography.trim() ? biography.trim().split(/\s+/).filter(Boolean).length : 0} of 500 words
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>Share your research interests, achievements, and strengths.</span>
                  </div>
                </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Technical Arsenal (Stack)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={stack} 
                  onChange={e => setStack(e.target.value)} 
                  placeholder="e.g. React, Next.js, FastAPI, PostgreSQL" 
                />
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-sub)' }}>List your primary tools, languages, and frameworks.</p>
              </div>
            </div>

              <div style={{ background: 'rgba(var(--brand-rgb), 0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                  <Calendar size={14} color="var(--brand)" />
                  My School
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Enrollment</label>
                    <input type="number" className="form-input" value={enrollmentYear} onChange={e => setEnrollmentYear(parseInt(e.target.value) || new Date().getFullYear())} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Completion</label>
                    <input type="number" className="form-input" value={completionYear} onChange={e => setCompletionYear(parseInt(e.target.value) || (new Date().getFullYear() + 3))} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                  {saving ? 'Syncing...' : 'Update Settings'}
                </button>
              </div>
            </form>
          </div>
        )}


        {activeTab === 'team' && isAdmin && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Team Management</h2>
                <p style={{ color: 'var(--text-sub)' }}>Manage collaborators and group visibility settings.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', background: isEncrypted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: `1px solid ${isEncrypted ? 'var(--error)' : 'var(--success)'}` }}>
                {isEncrypted ? <Shield size={18} color="var(--error)" /> : <Eye size={18} color="var(--success)" />}
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isEncrypted ? 'var(--error)' : 'var(--success)' }}>
                  {isEncrypted ? 'VISIBILITY: ENCRYPTED' : 'VISIBILITY: PUBLIC'}
                </span>
                <button
                  onClick={handleToggleEncryption}
                  disabled={updatingGroup}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', marginLeft: '0.5rem' }}
                >
                  Toggle
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {teamMembers.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', overflow: 'hidden', position: 'relative' }}>
                      {member.avatar_url ? <Image src={member.avatar_url} alt={`${member.full_name || 'Team'} avatar`} fill sizes="40px" style={{ objectFit: 'cover' }} unoptimized /> : <User size={20} style={{ margin: '10px' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{member.full_name || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase' }}>{member.role}</div>
                    </div>
                  </div>

                  {member.id !== profile?.id && member.role !== 'admin' && (
                    <button
                      onClick={() => handleKickUser(member.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                    >
                      <UserMinus size={16} /> Kick
                    </button>
                  )}
                  {member.id === profile?.id && <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 700 }}>YOU</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'workspace' && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Workspace Management</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>Switch between project teams or manage your group affiliation.</p>

            <div style={{ background: 'var(--bg-sub)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {(() => {
                type GroupSummary = { name?: string | null; module_code?: string | null }
                const groupRelation = (profile as Profile & { groups?: GroupSummary | GroupSummary[] }).groups
                const groupData = Array.isArray(groupRelation)
                  ? groupRelation[0]
                  : groupRelation
                
                return (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>Current Team</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{groupData?.name || 'No team assigned'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>{groupData?.module_code || 'Independent'}</div>
                  </div>
                )
              })()}
              {profile?.group_id && (
                <button
                  onClick={() => handleSwitchGroup(null)}
                  disabled={switching}
                  className="btn"
                  style={{ width: 'auto', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}
                >
                  Leave Team
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
               <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Other Teams</h3>
               <div style={{ position: 'relative', width: '250px' }}>
                 <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
                 <input 
                   type="text" 
                   placeholder="Filter teams..." 
                   value={groupSearch}
                   onChange={(e) => setGroupSearch(e.target.value)}
                   style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '10px', background: 'var(--bg-sub)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                 />
                 {groupSearch && (
                   <button onClick={() => setGroupSearch('')} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
                 )}
               </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {availableGroups
                .filter(g => g.id !== profile?.group_id)
                .filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()) || (g.module_code?.toLowerCase() || '').includes(groupSearch.toLowerCase()))
                .map(group => {
                const isPending = pendingRequests.includes(group.id)
                const isSent = sentRequests.includes(group.id)

                const handleQuickRequest = async () => {
                  if (isPending || isSent) return
                  setPendingRequests(prev => [...prev, group.id])
                  try {
                    const { sendJoinRequest } = await import('../join/actions')
                    await sendJoinRequest(group.id, fullName || 'A student')
                    setSentRequests(prev => [...new Set([...prev, group.id])])
                  } catch (err: unknown) {
                    setError(`Request failed: ${getErrorMessage(err, 'unknown request error')}`)
                  } finally {
                    setPendingRequests(prev => prev.filter(id => id !== group.id))
                  }
                }

                return (
                  <div
                    key={group.id}
                    style={{ padding: '1.25rem', background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{group.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 700 }}>{group.module_code}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <button
                         onClick={handleQuickRequest}
                         disabled={isPending || isSent}
                         className={isSent ? "btn btn-ghost" : "btn btn-secondary"}
                         style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: isSent ? 0.7 : 1, fontSize: isSent ? '0.75rem' : '0.85rem' }}
                       >
                         {isPending ? <div className="spinner-mini" /> : isSent ? <CheckCircle2 size={16} color="var(--success)" /> : null}
                         {isPending ? 'Sending...' : isSent ? 'Request sent. Waiting for team leader approval' : 'Request'}
                       </button>
                       <button
                         onClick={() => window.location.href = `/dashboard/analytics/${group.id}`}
                         className="btn btn-ghost"
                         style={{ width: 'auto', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                         title="Preview Analytics"
                       >
                         <Eye size={18} />
                       </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Look & Feel</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>Customize your workspace with high-end, professionally curated themes.</p>

            {/* PERFORMANCE OPTIMIZATION (NEW) */}
            <div style={{ marginBottom: '3.5rem', padding: '1.5rem', background: isToasterMode ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isToasterMode ? 'var(--brand)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isToasterMode ? 'white' : 'var(--text-sub)' }}>
                  <PulseIcon size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Low Power Mode</h3>
                  <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: 600 }}>Optimizes performance for low-end devices and slow connections by disabling heavy visual effects.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const next = !isToasterMode
                  setIsToasterMode(next)
                  localStorage.setItem('gf_toaster_mode', String(next))
                  // Update document class immediately for instant feedback
                  if (next) document.body.classList.add('toaster-mode')
                  else document.body.classList.remove('toaster-mode')
                  addToast('Performance Protocol Updated', next ? 'Low Power Mode enabled.' : 'Standard performance restored.', 'info')
                }}
                className={isToasterMode ? "btn btn-primary" : "btn btn-secondary"}
                style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
              >
                {isToasterMode ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Render themes grouped by tier */}
            {(['free', 'pro', 'premium', 'lifetime'] as const).map(tier => {
              if (tier === 'lifetime' && profile?.subscription_plan !== 'lifetime') return null; // Only show lifetime tier to lifetime users, or handle differently
              
              const tierThemes = PALETTES.filter(p => (p.tier || 'free') === tier);
              const isLocked = tier !== 'free' && 
                               profile?.subscription_plan !== 'premium' && 
                               profile?.subscription_plan !== 'lifetime' && 
                               (tier !== 'pro' || profile?.subscription_plan !== 'pro');
              const canAccess = !isLocked;

              return (
                <div key={tier} style={{ marginBottom: '3.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: tier === 'premium' ? '#d4af37' : tier === 'pro' ? 'var(--brand)' : 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {tier === 'premium' ? <Award size={20} /> : tier === 'pro' ? <Shield size={20} /> : <PaletteIcon size={20} />}
                      {tier} Collection
                    </h3>
                    {isLocked && (
                      <button 
                        onClick={() => setActiveTab('billing')}
                        className="btn btn-sm btn-primary shimmer-gold" 
                        style={{ width: 'auto', background: tier === 'premium' ? 'linear-gradient(135deg, #d4af37 0%, #ffdf00 100%)' : 'var(--brand)' }}
                      >
                        Unlock {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    {tierThemes.map(p => (
                      <div 
                        key={p.name}
                        style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                        className={p.name === 'Gold Luxury' ? 'shimmer-gold premium-glow' : ''}
                      >
                        <button
                          disabled={!canAccess}
                          onClick={async () => {
                            try {
                              await setPalette(p.name)
                              addToast('Appearance Synced', `The ${p.name} palette has been successfully applied to your terminal.`, 'success')
                            } catch (err: unknown) {
                              const errorMessage = getErrorMessage(err)
                              if (errorMessage === 'PREMIUM_LOCKED' || errorMessage === 'PRO_LOCKED') {
                                addToast('Access Unauthorized', 'This visual protocol requires higher institutional clearance.', 'error')
                                setActiveTab('billing')
                              } else {
                                addToast('Sync Error', errorMessage || 'Failed to apply theme.', 'error')
                              }
                            }
                          }}
                          style={{
                            width: '100%', padding: '1.25rem', background: p.colors['--bg-sub'], border: currentPalette.name === p.name ? `3px solid ${p.colors['--brand']}` : '1px solid var(--border)',
                            borderRadius: 'inherit', textAlign: 'left', cursor: canAccess ? 'pointer' : 'default', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', gap: '1rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 850, color: p.colors['--text-main'], fontSize: '0.95rem' }}>{p.name}</span>
                            {currentPalette.name === p.name && (
                              <div style={{ background: p.colors['--brand'], color: 'white', borderRadius: '50%', padding: '4px' }}>
                                <CheckCircle2 size={14} />
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[p.colors['--brand'], p.colors['--accent'], p.colors['--bg-main'], p.colors['--text-main']].map((c, i) => (
                              <div key={i} style={{ width: '24px', height: '24px', borderRadius: '8px', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                            ))}
                          </div>
                        </button>

                        {isLocked && (
                          <div 
                            className="glass-lock"
                            onClick={() => setActiveTab('billing')}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, cursor: 'pointer' }}
                          >
                            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                              <Lock size={20} color="white" />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier} Only</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900 }}>
                <ImageIcon size={20} color="var(--brand)" /> Custom Canvas
              </h3>
              <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: '32px', padding: '3rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                {customBg ? (
                  <div style={{ position: 'relative', width: '240px', height: '120px', borderRadius: '24px', overflow: 'hidden', margin: '0 auto 1.5rem', border: '3px solid var(--brand)', boxShadow: 'var(--shadow-lg)' }}>
                    <Image src={customBg} alt="Custom workspace background" fill sizes="240px" style={{ objectFit: 'cover' }} unoptimized />
                    <button
                      onClick={() => setCustomBg(null)}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px dashed var(--border)', color: 'var(--text-sub)' }}>
                    <ImageIcon size={40} />
                  </div>
                )}
                <label className="btn btn-primary shimmer-gold" style={{ width: 'auto', cursor: 'pointer', padding: '0.8rem 2rem' }}>
                  {uploadingBg ? 'Syncing...' : customBg ? 'Swap Artwork' : 'Upload Custom Backdrop'}
                  <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'bg')} style={{ display: 'none' }} />
                </label>
                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 600 }}>Immersive glassmorphism will adapt to your custom imagery.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Identity Protocol & Integrations</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>Configure your technical credentials and project toolkit connections.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Primary Identity</h3>
                    <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>{profile?.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                   <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', fontSize: '0.7rem', fontWeight: 800, border: 'none' }}>ACTIVE_NODE</span>
                   <button className="btn btn-sm btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>Secure Registry</button>
                </div>
              </div>

              <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <PulseIcon size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>GitHub Connection</h3>
                    <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>{isGithubLinked ? 'Identity Protocol Active' : 'One-click technical login'}</p>
                  </div>
                </div>
                {isGithubLinked ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                    <CheckCircle2 size={16} /> CONNECTED
                  </div>
                ) : (
                  <button
                    onClick={() => handleLinkIdentity('github.com')}
                    disabled={saving}
                    className="btn btn-sm btn-primary"
                    style={{ marginTop: '0.5rem', borderRadius: '10px' }}
                  >
                    {saving ? 'Syncing...' : 'Link GitHub Identity'}
                  </button>
                )}
              </div>

              <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Google Identity</h3>
                    <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>{isGoogleLinked ? 'Identity Protocol Active' : 'Credential synchronization'}</p>
                  </div>
                </div>
                {isGoogleLinked ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                    <CheckCircle2 size={16} /> CONNECTED
                  </div>
                ) : (
                  <button
                    onClick={() => handleLinkIdentity('google.com')}
                    disabled={saving}
                    className="btn btn-sm btn-secondary"
                    style={{ marginTop: '0.5rem', borderRadius: '10px', background: 'white', color: 'black', border: '1px solid var(--border)' }}
                  >
                    {saving ? 'Syncing...' : 'Link Google Identity'}
                  </button>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 color="var(--brand)" size={22} /> Technical Arsenal
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {(() => {
                  const DEFAULT_TOOLS = [
                    'React', 'Next.js', 'Tailwind', 
                    'Node.js', 'Python', 'Firebase', 'PostgreSQL', 
                    'AWS', 'Docker', 'Vercel',
                    'Figma', 'VS Code'
                   ]
                   
                   const currentAchievements = pendingAchievements || profile?.achievements || []
                   const activeTools = currentAchievements.map((a: Achievement) => a.name)
                   
                   const userCustomTools = currentAchievements
                    .filter((a: Achievement) => !DEFAULT_TOOLS.includes(a.name))
                    .map((a: Achievement) => a.name)
                   
                   const allDisplayTools = Array.from(new Set([...DEFAULT_TOOLS, ...userCustomTools]))
                   
                   const handleSyncArsenal = async () => {
                      if (!profile || !pendingAchievements) return
                      setSaving(true)
                      try {
                        await updateDoc(doc(db, 'profiles', profile.id), { achievements: pendingAchievements })
                        logActivity(profile.id, profile.group_id || 'system', 'setting_updated', "Overhauled technical arsenal")
                        addToast('Arsenal Verified', 'Your updated toolkit has been saved to your academic record.', 'success')
                        setPendingAchievements(null)
                        setSaveConfirmation(false)
                        refreshProfile()
                      } catch (err: any) {
                        setError("Synchronization failed.")
                      }
                      setSaving(false)
                    }

                   return (
                     <>
                       {allDisplayTools.map(tool => {
                        const isConnected = activeTools.includes(tool)
                        
                        const toggleTool = () => {
                          const achievements = [...currentAchievements]
                          let next
                          if (isConnected) {
                            next = achievements.filter((a: Achievement) => a.name !== tool)
                          } else {
                            next = [...achievements, { name: tool, date: new Date().toISOString() }]
                          }
                          setPendingAchievements(next)
                        }

                        return (
                          <div 
                            key={tool}
                            onClick={toggleTool}
                            style={{
                              padding: '1.25rem',
                              background: isConnected ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)',
                              border: isConnected ? '2px solid var(--brand)' : '1px solid var(--border)',
                              borderRadius: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              cursor: 'pointer',
                              transform: isConnected ? 'scale(1.02)' : 'scale(1)'
                            }}
                          >
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isConnected ? 'var(--brand)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isConnected ? 'white' : 'var(--text-sub)' }}>
                                   <Settings size={16} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isConnected ? 'var(--text-main)' : 'var(--text-sub)' }}>{tool}</span>
                             </div>
                             
                             <div style={{ padding: '0.4rem', color: isConnected ? 'var(--error)' : 'var(--brand)' }}>
                                {isConnected ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}
                             </div>
                          </div>
                        )
                       })}

                       <div 
                         style={{
                           padding: '1.25rem',
                           background: 'var(--bg-sub)',
                           border: '1.5px dashed var(--border)',
                           borderRadius: '16px',
                           display: 'flex',
                           flexDirection: 'column',
                           gap: '0.5rem'
                         }}
                       >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                             <Settings size={14} color="var(--brand)" />
                             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Add Custom</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <input 
                               type="text" 
                               className="form-input" 
                               placeholder="e.g. Docker" 
                               value={customToolInput}
                               onChange={e => setCustomToolInput(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter' && customToolInput.trim()) {
                                   const toolName = customToolInput.trim()
                                   const achievements = currentAchievements
                                   if (achievements.some((a: Achievement) => a.name.toLowerCase() === toolName.toLowerCase())) {
                                     setError("This tool is already in your arsenal.")
                                     return
                                   }
                                   setPendingAchievements([...achievements, { name: toolName, date: new Date().toISOString() }])
                                   setCustomToolInput('')
                                 }
                               }}
                               style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} 
                             />
                          </div>
                       </div>
                       
                       {pendingAchievements !== null && (
                         <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.3s ease-out' }}>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => setSaveConfirmation(true)}
                              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            >
                               <Save size={18} /> Synchronize Arsenal Changes
                            </button>
                         </div>
                       )}

                       {saveConfirmation && (
                         <div className="modal-overlay" style={{ zIndex: 10000 }}>
                            <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                               <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>Commit Toolkit Update?</h3>
                               <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                 This will update your public scholar profile with the selected technical arsenal.
                               </p>
                               <div style={{ display: 'flex', gap: '1rem' }}>
                                  <button className="btn btn-secondary" onClick={() => setSaveConfirmation(false)}>Cancel</button>
                                  <button className="btn btn-primary" onClick={handleSyncArsenal} disabled={saving}>
                                    {saving ? 'Saving...' : 'Confirm Sync'}
                                  </button>
                               </div>
                            </div>
                         </div>
                       )}
                     </>
                   )
                })()}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="auth-card" style={{ maxWidth: '100%' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Personal Data Management</h2>
              <p style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>Audit and export your activity within the Espeezy ecosystem.</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Export My Data</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-sub)' }}>Download all your task and activity data.</p>
                </div>
                <button className="btn btn-secondary" onClick={handleDownloadData} style={{ width: 'auto' }}>Export</button>
              </div>
            </div>

            <div className="auth-card" style={{ maxWidth: '100%', border: '1.5px solid var(--error)', background: 'rgba(239, 68, 68, 0.02)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={24} /> Danger Zone
              </h2>
              <p style={{ color: 'var(--text-sub)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Terminating your account is an irreversible action. You will lose access to all teams, progress metrics, specialized badges, and verifiable audit logs.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--error)', fontWeight: 800 }}>Delete this account</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-sub)' }}>Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button 
                  className="btn" 
                  onClick={() => setIsDeleteModalOpen(true)}
                  style={{ width: 'auto', background: 'var(--error)', color: 'white' }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isDeleteModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem', color: 'var(--error)' }}><AlertTriangle size={60} /></div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Final Confirmation</h3>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              This will <strong>permanently delete</strong> your Espeezy account and all associated data. This action cannot be undone.
            </p>
            <input
              type="text" className="form-input" placeholder="Type DELETE to confirm" value={deleteConfirmation}
              onChange={e => setDeleteConfirmation(e.target.value)}
              style={{ border: '2px solid var(--error)', textAlign: 'center', fontWeight: 'bold' }}
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button
                className="btn" onClick={handleAccountTermination} disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                style={{ background: 'var(--error)', color: 'white', opacity: deleteConfirmation === 'DELETE' ? 1 : 0.4 }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --gap-sm: 2.5rem;
            --avatar-size: 120px;
          }
          @media (max-width: 768px) {
            :root {
              --gap-sm: 1.25rem;
              --avatar-size: 80px;
            }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
       `}} />
    </div>
  )
}
