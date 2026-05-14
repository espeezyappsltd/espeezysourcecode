'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { logActivity } from '@/utils/logging'
import { Palette, ThemeContextType } from '@/types/ui'

export const PALETTES: Palette[] = [
  /* FREE THEMES */
  {
    name: 'Google Light',
    tier: 'free',
    colors: {
      '--bg-main': '#f8fafc',
      '--bg-sub': '#ffffff',
      '--text-main': '#1f2937',
      '--text-sub': '#6b7280',
      '--brand': '#1a73e8',
      '--brand-hover': '#174ea6',
      '--accent': '#4285f4',
      '--border': '#dadce0',
      '--surface': '#ffffff',
      '--error': '#d93025',
      '--success': '#1e8e3e',
      '--warning': '#f9ab00',
      '--overlay': 'rgba(60, 64, 67, 0.3)',
    }
  },
  {
    name: 'Deep Oceanic',
    tier: 'free',
    colors: {
      '--bg-main': '#0f172a',
      '--bg-sub': '#1e293b',
      '--text-main': '#f8fafc',
      '--text-sub': '#94a3b8',
      '--brand': '#38bdf8',
      '--brand-hover': '#0ea5e9',
      '--accent': '#818cf8',
      '--border': '#334155',
      '--surface': '#1e293b',
      '--error': '#ef4444',
      '--success': '#10b981',
      '--warning': '#f59e0b',
      '--overlay': 'rgba(0, 0, 0, 0.5)',
    }
  },
  {
    name: 'Cyberpunk',
    tier: 'free',
    colors: {
      '--bg-main': '#050510',
      '--bg-sub': '#0a0a20',
      '--text-main': '#00ffcc',
      '--text-sub': '#b0b0d0',
      '--brand': '#e900ff',
      '--brand-hover': '#ff00aa',
      '--accent': '#00ffcc',
      '--border': '#300060',
      '--surface': '#101025',
      '--error': '#ff3030',
      '--success': '#30ff30',
      '--warning': '#ffcc00',
      '--overlay': 'rgba(10, 0, 30, 0.7)',
    }
  },
  {
    name: 'Nature',
    tier: 'free',
    colors: {
      '--bg-main': '#eef5eb',
      '--bg-sub': '#ffffff',
      '--text-main': '#1f3d2f',
      '--text-sub': '#5f7d68',
      '--brand': '#2f7d54',
      '--brand-hover': '#276843',
      '--accent': '#76b79b',
      '--border': '#d9e2d4',
      '--surface': '#f8faf5',
      '--error': '#c53030',
      '--success': '#2d7d46',
      '--warning': '#d69e2e',
      '--overlay': 'rgba(47, 125, 84, 0.12)',
    }
  },

  /* PRO THEMES */
  {
    name: 'Emerald Pro',
    tier: 'pro',
    colors: {
      '--bg-main': '#062016',
      '--bg-sub': '#0a2e20',
      '--text-main': '#ecfdf5',
      '--text-sub': '#6ee7b7',
      '--brand': '#10b981',
      '--brand-hover': '#34d399',
      '--accent': '#059669',
      '--border': '#115e42',
      '--surface': '#0c3e2e',
      '--error': '#f87171',
      '--success': '#34d399',
      '--warning': '#fcd34d',
      '--overlay': 'rgba(6, 32, 22, 0.6)',
    }
  },
  {
    name: 'Midnight Indigo',
    tier: 'pro',
    colors: {
      '--bg-main': '#020617',
      '--bg-sub': '#0f172a',
      '--text-main': '#f8fafc',
      '--text-sub': '#94a3b8',
      '--brand': '#6366f1',
      '--brand-hover': '#818cf8',
      '--accent': '#a5b4fc',
      '--border': '#1e293b',
      '--surface': '#0f172a',
      '--error': '#ef4444',
      '--success': '#10b981',
      '--warning': '#f59e0b',
      '--overlay': 'rgba(2, 6, 23, 0.8)',
    }
  },
  {
    name: 'Slate Focus',
    tier: 'pro',
    colors: {
      '--bg-main': '#ffffff',
      '--bg-sub': '#f1f5f9',
      '--text-main': '#0f172a',
      '--text-sub': '#475569',
      '--brand': '#334155',
      '--brand-hover': '#1e293b',
      '--accent': '#64748b',
      '--border': '#cbd5e1',
      '--surface': '#f8fafc',
      '--error': '#dc2626',
      '--success': '#16a34a',
      '--warning': '#d97706',
      '--overlay': 'rgba(15, 23, 42, 0.1)',
    }
  },
  {
    name: 'Oceanic Pro',
    tier: 'pro',
    colors: {
      '--bg-main': '#f0f9ff',
      '--bg-sub': '#ffffff',
      '--text-main': '#0c4a6e',
      '--text-sub': '#0ea5e9',
      '--brand': '#0284c7',
      '--brand-hover': '#0369a1',
      '--accent': '#38bdf8',
      '--border': '#bae6fd',
      '--surface': '#f8fafc',
      '--error': '#e11d48',
      '--success': '#059669',
      '--warning': '#ea580c',
      '--overlay': 'rgba(2, 132, 199, 0.1)',
    }
  },

  /* PREMIUM THEMES */
  {
    name: 'Gold Luxury',
    tier: 'premium',
    colors: {
      '--bg-main': '#0a0a0a',
      '--bg-sub': '#141414',
      '--text-main': '#ffffff',
      '--text-sub': '#a0a0a0',
      '--brand': '#d4af37',
      '--brand-hover': '#ffdf00',
      '--accent': '#c5a028',
      '--border': '#2a2a2a',
      '--surface': '#1a1a1a',
      '--error': '#ff4d4d',
      '--success': '#d4af37', // Gold success for premium feel
      '--warning': '#ffdf00',
      '--overlay': 'rgba(0, 0, 0, 0.85)',
    }
  },
  {
    name: 'Executive Success',
    tier: 'premium',
    colors: {
      '--bg-main': '#1a1c2c',
      '--bg-sub': '#25274d',
      '--text-main': '#ffffff',
      '--text-sub': '#b8b9c1',
      '--brand': '#f7b731',
      '--brand-hover': '#f9ca24',
      '--accent': '#4b7bec',
      '--border': '#2d3436',
      '--surface': '#25274d',
      '--error': '#eb4d4b',
      '--success': '#6ab04c',
      '--warning': '#f9ca24',
      '--overlay': 'rgba(26, 28, 44, 0.7)',
    }
  },
  {
    name: 'Diamond Frost',
    tier: 'premium',
    colors: {
      '--bg-main': '#f0f4f8',
      '--bg-sub': '#ffffff',
      '--text-main': '#1a365d',
      '--text-sub': '#2b6cb0',
      '--brand': '#63b3ed',
      '--brand-hover': '#4299e1',
      '--accent': '#90cdf4',
      '--border': '#bee3f8',
      '--surface': '#ebf8ff',
      '--error': '#e53e3e',
      '--success': '#38a169',
      '--warning': '#dd6b20',
      '--overlay': 'rgba(99, 179, 237, 0.15)',
    }
  },
  {
    name: 'Solar Flare',
    tier: 'premium',
    colors: {
      '--bg-main': '#121212',
      '--bg-sub': '#1e1e1e',
      '--text-main': '#f5f5f5',
      '--text-sub': '#bdbdbd',
      '--brand': '#ff6b6b',
      '--brand-hover': '#ff5252',
      '--accent': '#feca57',
      '--border': '#333333',
      '--surface': '#262626',
      '--error': '#ff3f34',
      '--success': '#05c46b',
      '--warning': '#ffd32a',
      '--overlay': 'rgba(0, 0, 0, 0.8)',
    }
  },
  {
    name: 'Crimson Peak',
    tier: 'premium',
    colors: {
      '--bg-main': '#0f0202',
      '--bg-sub': '#1a0505',
      '--text-main': '#fee2e2',
      '--text-sub': '#f87171',
      '--brand': '#991b1b',
      '--brand-hover': '#b91c1c',
      '--accent': '#ef4444',
      '--border': '#450a0a',
      '--surface': '#1a0505',
      '--error': '#dc2626',
      '--success': '#16a34a',
      '--warning': '#f59e0b',
      '--overlay': 'rgba(15, 2, 2, 0.9)',
    }
  },
  {
    name: 'Golden Hour',
    tier: 'premium',
    colors: {
      '--bg-main': '#fff7ed',
      '--bg-sub': '#ffffff',
      '--text-main': '#7c2d12',
      '--text-sub': '#c2410c',
      '--brand': '#ea580c',
      '--brand-hover': '#f97316',
      '--accent': '#fb923c',
      '--border': '#ffedd5',
      '--surface': '#fffaf0',
      '--error': '#b91c1c',
      '--success': '#15803d',
      '--warning': '#f59e0b',
      '--overlay': 'rgba(234, 88, 12, 0.1)',
    }
  },
  {
    name: 'Obsidian Success',
    tier: 'premium',
    colors: {
      '--bg-main': '#000000',
      '--bg-sub': '#050505',
      '--text-main': '#ffffff',
      '--text-sub': '#404040',
      '--brand': '#00ff00',
      '--brand-hover': '#33ff33',
      '--accent': '#00ff00',
      '--border': '#111111',
      '--surface': '#080808',
      '--error': '#ff0000',
      '--success': '#00ff00',
      '--warning': '#ffff00',
      '--overlay': 'rgba(0, 0, 0, 0.95)',
    }
  },
  {
    name: 'Obsidian Gold',
    tier: 'premium',
    colors: {
      '--bg-main': '#000000',
      '--bg-sub': '#0a0a0a',
      '--text-main': '#ffffff',
      '--text-sub': '#888888',
      '--brand': '#d4af37',
      '--brand-hover': '#f1c40f',
      '--accent': '#9c8644',
      '--border': '#1a1a1a',
      '--surface': '#0c0c0c',
      '--error': '#ff3333',
      '--success': '#d4af37',
      '--warning': '#f1c40f',
      '--overlay': 'rgba(0, 0, 0, 0.9)',
    }
  },
  {
    name: 'Archival Vellum',
    tier: 'pro',
    colors: {
      '--bg-main': '#f9f7f2',
      '--bg-sub': '#ffffff',
      '--text-main': '#1a1a1a',
      '--text-sub': '#5c5c5c',
      '--brand': '#7c2d12',
      '--brand-hover': '#9a3412',
      '--accent': '#431407',
      '--border': '#e7e5e4',
      '--surface': '#ffffff',
      '--error': '#991b1b',
      '--success': '#166534',
      '--warning': '#854d0e',
      '--overlay': 'rgba(124, 45, 18, 0.05)',
    }
  },
  {
    name: 'Neon Overdrive',
    tier: 'premium',
    colors: {
      '--bg-main': '#020204',
      '--bg-sub': '#050508',
      '--text-main': '#00f7ff',
      '--text-sub': '#ff00ff',
      '--brand': '#ff00ff',
      '--brand-hover': '#00f7ff',
      '--accent': '#7000ff',
      '--border': '#101020',
      '--surface': '#0a0a15',
      '--error': '#ff0000',
      '--success': '#00ff00',
      '--warning': '#ffff00',
      '--overlay': 'rgba(0, 0, 0, 0.8)',
    }
  },
  {
    name: 'Midnight Platinum',
    tier: 'premium',
    colors: {
      '--bg-main': '#020617',
      '--bg-sub': '#0f172a',
      '--text-main': '#f8fafc',
      '--text-sub': '#94a3b8',
      '--brand': '#e2e8f0',
      '--brand-hover': '#ffffff',
      '--accent': '#64748b',
      '--border': '#1e293b',
      '--surface': '#0f172a',
      '--error': '#ef4444',
      '--success': '#10b981',
      '--warning': '#f59e0b',
      '--overlay': 'rgba(2, 6, 23, 0.85)',
    }
  }
]

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

export type ThemeInitialValues = {
  palette?: string
  bgUrl?: string
}

export const ThemeProvider = ({ children, initialTheme, userPlan }: { children: React.ReactNode, initialTheme?: ThemeInitialValues, userPlan?: string | null }) => {
  // Use initialTheme for initial state to prevent flash during hydration
  const [currentPalette, setCurrentPalette] = useState<Palette>(() => {
    if (initialTheme?.palette) {
      return PALETTES.find(p => p.name === initialTheme.palette) || PALETTES[0]
    }
    // Fallback to system preference if no localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('espeezy_palette')
      if (saved) {
        const found = PALETTES.find(p => p.name === saved)
        if (found) return found
      }
      
      // Automatic A11y Sync: Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? PALETTES[1] : PALETTES[0] // Deep Oceanic for dark, Google Light for light
    }
    return PALETTES[0]
  })
  
  const [customBg, setCustomBg] = useState<string | null>(initialTheme?.bgUrl || null)
  const db = createBrowserSupabaseClient()

  useEffect(() => {
    let mounted = true
    const restoreTheme = async () => {
      if (!mounted) return

      if (initialTheme?.palette) {
        const palette = PALETTES.find(p => p.name === initialTheme.palette)
        if (palette) setCurrentPalette(palette)
      }
      if (initialTheme?.bgUrl) setCustomBg(initialTheme.bgUrl)
    }

    void restoreTheme()
    return () => {
      mounted = false
    }
  }, [initialTheme])



  const setPalette = async (name: string) => {
    const palette = PALETTES.find(p => p.name === name)
    if (palette) {
      // Access Control Enforcement
      const tier = palette.tier || 'free'
      const isPremium = userPlan === 'premium'
      const isPro = userPlan === 'pro' || isPremium

      if (tier === 'premium' && !isPremium) {
        throw new Error('PREMIUM_LOCKED')
      }
      if (tier === 'pro' && !isPro) {
        throw new Error('PRO_LOCKED')
      }

      setCurrentPalette(palette)
      localStorage.setItem('espeezy_palette', name) 
      const { data: { user } } = await db.auth.getUser()
        if (user) {
          await db.from('profiles').update({ 
            theme_config: { palette: name } 
          }).eq('id', user.id)

          const { data: profile } = await db.from('profiles').select('group_id').eq('id', user.id).single()
          logActivity(user.id, profile?.group_id, 'theme_changed', `Changed palette to ${name}`)
        }
    }
  }

  const handleSetCustomBg = async (url: string | null) => {
    setCustomBg(url)
    if (url) localStorage.setItem('espeezy_bg', url)
    else localStorage.removeItem('espeezy_bg')
    
    const { data: { user } } = await db.auth.getUser()
    if (user) {
      await db.from('profiles').update({ 
        custom_bg_url: url 
      }).eq('id', user.id)
    }
  }

  const activeColors = currentPalette.colors

  return (
    <ThemeContext.Provider value={{ currentPalette, setPalette, customBg, setCustomBg: handleSetCustomBg }}>
      {/* 
          Injected style tag ensures variables are present BEFORE hydration finishes, 
          eliminating the theme flash (FOUC) entirely.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${Object.entries(activeColors).map(([key, val]) => `${key}: ${val};`).join('\n')}
        }
      `}} />
      
      <div 
        className={`theme-wrapper ${customBg ? 'has-custom-bg' : ''}`}
        style={customBg ? { 
          backgroundImage: `url(${customBg})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundAttachment: 'fixed',
          minHeight: '100vh' 
        } : {}}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
