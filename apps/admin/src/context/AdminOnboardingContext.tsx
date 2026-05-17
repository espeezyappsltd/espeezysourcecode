'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'espeezy_admin_onboarding_v1'

export type OnboardingStep = {
  id: string
  title: string
  body: string
}

const GLOBAL_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Espeezy Admin',
    body: 'This console is organized like Google Cloud: use the left menu to jump between sections. Your role controls which pages you see.',
  },
  {
    id: 'learn',
    title: 'Dev learning',
    body: 'Open Dev learning for runbooks, monorepo ports, and staff workflows.',
  },
  {
    id: 'files',
    title: 'Private files',
    body: 'Each staff member gets 5GB in Files. Create folders, upload documents, and share with other admins.',
  },
]

type Ctx = {
  dismissed: boolean
  currentStep: number
  steps: OnboardingStep[]
  dismiss: () => void
  next: () => void
  pageHint: string | null
  setPageHint: (hint: string | null) => void
}

const AdminOnboardingContext = createContext<Ctx | null>(null)

export function AdminOnboardingProvider({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [pageHint, setPageHint] = useState<string | null>(null)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === 'done')
    } catch {
      setDismissed(false)
    }
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, 'done')
    } catch {
      /* ignore */
    }
  }, [])

  const next = useCallback(() => {
    if (currentStep >= GLOBAL_STEPS.length - 1) {
      dismiss()
      return
    }
    setCurrentStep((s) => s + 1)
  }, [currentStep, dismiss])

  return (
    <AdminOnboardingContext.Provider
      value={{
        dismissed,
        currentStep,
        steps: GLOBAL_STEPS,
        dismiss,
        next,
        pageHint,
        setPageHint,
      }}
    >
      {children}
    </AdminOnboardingContext.Provider>
  )
}

export function useAdminOnboarding() {
  const ctx = useContext(AdminOnboardingContext)
  if (!ctx) throw new Error('useAdminOnboarding must be used within AdminOnboardingProvider')
  return ctx
}
