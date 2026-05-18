'use client'

import { useCallback, useEffect, useState } from 'react'
import { storage, ref, uploadBytes, getDownloadURL } from '@/lib/db-client'
import imageCompression from 'browser-image-compression'
import { useTheme } from '@/context/ThemeContext'
import { kickUser } from '@/app/join/actions'
import { logActivity } from '@/utils/logging'
import { TabName } from '@/types/ui'
import { Profile } from '@/types/auth'
import { Achievement, Group } from '@/types/database'
import { buildStripePaymentLink } from '@/lib/stripe-payment-links'
import { useNotifications } from '@/components/NotificationProvider'
import { useProfile } from '@/context/ProfileContext'
import { deleteAccount, createStripePortalSession } from '@/services/account'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import {
  createUserFeedback,
  fetchGroupById,
  fetchGroupMembers,
  fetchGroupsOrderedByName,
  fetchMessagesForUser,
  fetchProfileById,
  getAuthUser,
  updateGroupById,
  updateProfileById,
} from '@/services/dashboard'
import { formatSupabaseError, friendlySupabaseError } from '@/utils/supabase-errors'

export function useSettingsPage() {
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
    return formatSupabaseError(err, fallback)
  }

  const applyProfileToForm = useCallback((data: Profile) => {
    setFullName(data.full_name || '')
    setCourseName(data.course_name || '')
    setEnrollmentYear(data.enrollment_year || new Date().getFullYear())
    setCompletionYear(data.completion_year || new Date().getFullYear() + 3)
    setRank(data.rank || 'Senior')
    setTagline(data.tagline || '')
    setBiography(data.biography || '')
    setStack(data.stack || '')
    setAvatarUrl(data.avatar_url || '')
    setCountryCode(data.country_code || '')
    setProtectAvatar(Boolean(data.protect_avatar))
    setIsPhoneVerified(Boolean(data.is_phone_verified))
  }, [])

  useEffect(() => {
    if (isToasterMode) document.body.classList.add('toaster-mode')
    else document.body.classList.remove('toaster-mode')
  }, [isToasterMode])

  const fetchGroups = useCallback(async () => {
    try {
      const data = await fetchGroupsOrderedByName()
      setAvailableGroups(data)
    } catch (err) {
      console.warn('Fetch groups for settings:', formatSupabaseError(err))
    }
  }, [])

  const fetchJoinRequests = useCallback(async (userId: string) => {
    const messages = await fetchMessagesForUser(userId)
    const requests = messages
      .filter((m) => m.content?.includes('[JOIN REQUEST]'))
      .map((m) => m.group_id)

    setSentRequests(Array.from(new Set(requests as string[])))
  }, [])

  const fetchTeam = useCallback(async (groupId: string) => {
    const data = await fetchGroupMembers(groupId)
    setTeamMembers(data as unknown as Profile[])
  }, [])

  const fetchUserData = useCallback(async () => {
    try {
      const user = await getAuthUser()
      if (!user) {
        setError('You must be signed in to view settings.')
        return
      }

      const providers = (user.app_metadata?.providers as string[]) || []
      setIsGithubLinked(providers.includes('github'))
      setIsGoogleLinked(providers.includes('google'))

      if (profile?.id === user.id) {
        applyProfileToForm(profile)
      }

      let data: Profile | null = null
      try {
        data = (await fetchProfileById(user.id)) as Profile | null
      } catch (err) {
        const message = friendlySupabaseError(
          formatSupabaseError(err, 'Failed to load profile'),
          'Failed to load profile',
        )
        console.error('Fetch user data error:', message, err)
        setError(message)
        if (profile?.id === user.id) {
          return
        }
      }

      if (data) {
        applyProfileToForm(data)

        let groupData: Group | null = null
        if (data.group_id) {
          try {
            groupData = await fetchGroupById(data.group_id)
            setIsEncrypted(groupData?.is_encrypted || false)
          } catch (err) {
            console.warn('Fetch group for settings:', formatSupabaseError(err))
          }
        }

        try {
          await fetchJoinRequests(user.id)
        } catch (err) {
          console.warn('Fetch join requests:', formatSupabaseError(err))
        }

        if (data.group_id) {
          try {
            await fetchTeam(data.group_id)
          } catch (err) {
            console.warn('Fetch team members:', formatSupabaseError(err))
          }
        }

        setProfile({ ...data, groups: groupData } as unknown as Profile)
      } else if (!profile?.id) {
        setProfile({ id: user.id, email: user.email } as unknown as Profile)
      }
    } catch (err) {
      const message = formatSupabaseError(err, 'Failed to load settings')
      console.error('Fetch user data error:', message, err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [applyProfileToForm, fetchJoinRequests, fetchTeam, profile, setProfile])

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
      await updateProfileById(profile.id, {
        full_name: fullName,
        course_name: courseName,
        enrollment_year: enrollmentYear ? Number(enrollmentYear) : null,
        completion_year: completionYear ? Number(completionYear) : null,
        rank: rank,
        tagline: tagline,
        biography: biography,
        stack: stack,
        phone_number: phoneNumber,
        country_code: countryCode,
      })

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: fullName,
              course_name: courseName,
              enrollment_year: enrollmentYear ? Number(enrollmentYear) : null,
              completion_year: completionYear ? Number(completionYear) : null,
              rank,
              tagline,
              biography,
              stack,
              country_code: countryCode,
            }
          : prev,
      )

      if (profile.id) {
        logActivity(profile.id, profile.group_id || '', 'setting_updated', 'Updated profile and school info')
      }
      await refreshProfile()
      addToast(
        'Profile Synchronized',
        'Your academic journey and identity details have been successfully updated.',
        'success',
      )
    } catch (err: unknown) {
      setError(`Identity Sync Error: ${err instanceof Error ? err.message : 'Verification failed'}`)
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
      window.location.href = buildStripePaymentLink('pro', { client_reference_id: profile.id })
      return
    }

    if (plan === 'premium') {
      window.location.href = buildStripePaymentLink('premium', { client_reference_id: profile.id })
      return
    }
  }

  const handleRequestOtp = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number first.')
      return
    }
    addToast('Info', 'Phone verification is currently handled via specialized gateways.', 'info')
  }

  const handleVerifyOtp = async () => {
    // Placeholder for consistency
  }

  const handleToggleAvatarProtection = async (val: boolean) => {
    setProtectAvatar(val)
    if (!profile) return
    try {
      await updateProfileById(profile.id, { protect_avatar: val })
      addToast('Protection Updated', val ? 'Manual avatar locked.' : 'Provider sync enabled.', 'success')
    } catch (err: unknown) {
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
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })
      const fileName = `${profile.id}-${type}-${Date.now()}.jpg`
      const storageRef = ref(storage, `Espeezy_assets/${fileName}`)

      await uploadBytes(storageRef, compressedFile)
      const publicUrl = await getDownloadURL(storageRef)

      if (type === 'avatar') {
        const updateData = { avatar_url: publicUrl, manual_avatar_url: publicUrl }
        await updateProfileById(profile.id, updateData)
        setAvatarUrl(publicUrl)
      } else {
        await setCustomBg(publicUrl)
      }
      refreshProfile()
      addToast(
        'Visuals Updated',
        'Your appearance settings have been synchronized across all project hubs.',
        'success',
      )
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
      await updateGroupById(profile.group_id, { is_encrypted: nextValue })

      if (profile.id && profile.group_id) {
        logActivity(
          profile.id,
          profile.group_id,
          'privacy_toggled',
          `Changed group visibility to ${nextValue ? 'Encrypted' : 'Public'}`,
        )
      }
      setIsEncrypted(nextValue)
      addToast(
        'Visibility Changed',
        `Group visibility is now set to ${nextValue ? 'Encrypted' : 'Public'}.`,
        'success',
      )
    } catch (err: unknown) {
      setError(`Failed to update visibility: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
    setUpdatingGroup(false)
  }

  const handleLinkIdentity = async (provider: 'github.com' | 'google.com') => {
    setSaving(true)
    setError(null)
    addToast('Info', 'Identity linkage is managed during the secure login sequence.', 'info')
    setSaving(false)
  }

  const handleKickUser = async (userId: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this member from the team? They will lose access to all tasks and chat.',
      )
    )
      return

    const res = await kickUser(userId)
    if (res.error) {
      setError(res.error)
    } else {
      setTeamMembers((prev) => prev.filter((m) => m.id !== userId))
      addToast('Member Removed', 'The specialist has been safely removed from the group registry.', 'success')
    }
  }

  const handleDownloadData = () => window.open('/api/account', '_blank')

  const handleSwitchGroup = async (newGroupId: string | null) => {
    if (!profile) return
    setSwitching(true)
    setError(null)

    try {
      await updateProfileById(profile.id, { group_id: newGroupId, role: 'collaborator' })
      await fetchUserData()
      refreshProfile()
      addToast('Team Switched', 'You have been successfully re-assigned to the new project group.', 'success')
    } catch (err: unknown) {
      setError(`Sync failed: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
    setSwitching(false)
  }

  const handleAccountTermination = async () => {
    if (deleteConfirmation !== 'DELETE') return
    setIsDeleting(true)
    try {
      const result = await deleteAccount()
      if (!result.ok) throw new Error(result.error || 'Account termination failed')
      await createBrowserSupabaseClient().auth.signOut()
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
      const result = await createStripePortalSession()
      if (!result.ok || !result.url) throw new Error(result.error || 'Portal creation failed')
      window.location.href = result.url
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to open billing portal'))
      setLoadingPortal(false)
    }
  }

  const isAdmin = profile?.role?.toLowerCase() === 'admin'

  return {
    activeTab,
    setActiveTab,
    profile,
    refreshProfile,
    setProfile,
    fullName,
    setFullName,
    courseName,
    setCourseName,
    enrollmentYear,
    setEnrollmentYear,
    completionYear,
    setCompletionYear,
    rank,
    setRank,
    tagline,
    setTagline,
    biography,
    setBiography,
    stack,
    setStack,
    loading,
    error,
    setError,
    phoneNumber,
    setPhoneNumber,
    countryCode,
    setCountryCode,
    currentPalette,
    setPalette,
    customBg,
    setCustomBg,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    uploadingBg,
    addToast,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deleteConfirmation,
    setDeleteConfirmation,
    isDeleting,
    availableGroups,
    groupSearch,
    setGroupSearch,
    switching,
    teamMembers,
    isEncrypted,
    updatingGroup,
    customToolInput,
    setCustomToolInput,
    pendingAchievements,
    setPendingAchievements,
    saveConfirmation,
    setSaveConfirmation,
    saving,
    setSaving,
    feedbackMessage,
    setFeedbackMessage,
    feedbackCategory,
    setFeedbackCategory,
    submittingFeedback,
    setSubmittingFeedback,
    feedbackSuccess,
    setFeedbackSuccess,
    loadingPortal,
    pendingRequests,
    setPendingRequests,
    sentRequests,
    setSentRequests,
    isGithubLinked,
    isGoogleLinked,
    isPhoneVerified,
    otp,
    setOtp,
    otpStep,
    setOtpStep,
    protectAvatar,
    isToasterMode,
    setIsToasterMode,
    getErrorMessage,
    handleUpdateProfile,
    handleCheckout,
    handleRequestOtp,
    handleVerifyOtp,
    handleToggleAvatarProtection,
    handleFileUpload,
    handleToggleEncryption,
    handleLinkIdentity,
    handleKickUser,
    handleDownloadData,
    handleSwitchGroup,
    handleAccountTermination,
    handleManageSubscription,
    isAdmin,
  }
}
