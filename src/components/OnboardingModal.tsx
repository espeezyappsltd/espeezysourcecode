'use client'

import { useState } from 'react'
import Image from 'next/image'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  Zap
} from 'lucide-react'
import confetti from 'canvas-confetti'

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar1&backgroundColor=1a73e8',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar2&backgroundColor=34a853',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar3&backgroundColor=ea4335',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar4&backgroundColor=fbbc04',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar5&backgroundColor=9334e1',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar6&backgroundColor=111111',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar7&backgroundColor=ef4444',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Avatar8&backgroundColor=22c55e',
]

import { OnboardingModalProps } from '@/types/ui'

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const db = createBrowserSupabaseClient()

  const handleNext = async () => {
    if (step === 1 && !fullName) return
    if (step === 2 && !selectedAvatar) return
    
    if (step === 3) {
      onComplete()
      return
    }
    
    setStep(step + 1)
    if (step === 2) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1a73e8', '#34a853', '#ea4335', '#fbbc04']
      })
    }
  }

  const saveIdentity = async () => {
    setSaving(true)
    const { error } = await db
      .from('profiles')
      .update({ 
        full_name: fullName, 
        avatar_url: selectedAvatar 
      })
      .eq('id', user.id)
    
    setSaving(false)
    if (!error) handleNext()
  }

  return (
    <div className="onboarding-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="onboarding-content" style={{
        maxWidth: '500px', width: '90%', background: 'var(--surface)',
        borderRadius: '32px', border: '1px solid var(--border)',
        padding: '2rem 1.5rem', position: 'relative', overflowY: 'auto',
        maxHeight: 'calc(100dvh - 8rem)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '3rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ 
              flex: 1, height: '4px', borderRadius: '10px',
              background: i <= step ? 'var(--brand)' : 'var(--bg-main)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ animation: 'slideIn 0.4s ease-out' }}>
            <div style={{ padding: '1rem', background: 'rgba(26, 115, 232, 0.1)', color: 'var(--brand)', borderRadius: '16px', display: 'inline-flex', marginBottom: '1.5rem' }}>
              <ShieldCheck size={32} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>Welcome to Espeezy</h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Lets set up your profile. What name should we show in the dashboard?</p>
            
            <div className="form-group">
               <label className="form-label" style={{ fontSize: '0.8rem', opacity: 0.7 }}>YOUR FULL NAME</label>
               <input 
                 type="text" className="form-input" 
                 value={fullName} onChange={e => setFullName(e.target.value)} 
                 placeholder="e.g. Alan Turing"
                 autoFocus
                 style={{ fontSize: '1.25rem', padding: '1rem' }}
               />
            </div>
            
            <button 
              onClick={handleNext} 
              disabled={!fullName}
              className="btn btn-primary" 
              style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'slideIn 0.4s ease-out' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>Choose an Avatar</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>Select a profile icon to represent you in the workspace.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
              {PRESET_AVATARS.map((url, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedAvatar(url)}
                  style={{
                    padding: 0, border: selectedAvatar === url ? '3px solid var(--brand)' : '1px solid var(--border)',
                    borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-main)',
                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: selectedAvatar === url ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  <Image 
                    src={url} 
                    alt="Avatar option" 
                    width={100}
                    height={100}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </button>
              ))}
            </div>
            
            <button 
              onClick={saveIdentity} 
              disabled={!selectedAvatar || saving}
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
              {saving ? 'Saving...' : 'Finish Setup'} <CheckCircle2 size={20} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', animation: 'slideIn 0.4s ease-out' }}>
            <div style={{ 
              width: '100px', height: '100px', background: 'var(--success)', color: 'white', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 2rem', boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)'
            }}>
              <Sparkles size={48} />
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>All Set!</h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Your profile is ready. Welcome to the team, {fullName.split(' ')[0]}.</p>
            
            <button 
              onClick={handleNext} 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
              Go to Dashboard <Zap size={20} />
            </button>
          </div>
        )}

      </div>
      
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  )
}
