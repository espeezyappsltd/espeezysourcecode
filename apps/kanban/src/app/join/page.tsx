"use client"

import { createGroup, joinGroup } from './actions'
import { Plus, Key } from 'lucide-react'
import TransientError from '@/components/TransientError'
import { useFormStatus } from 'react-dom'

function SubmitButton({ label, secondary = false }: { label: string, secondary?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button 
      className={secondary ? "btn btn-secondary" : "btn btn-primary"} 
      disabled={pending} 
      style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
    >
      {pending ? (
        <>
          <div className="spinner-mini" style={{ borderTopColor: secondary ? 'var(--brand)' : 'white' }} />
          <span>Processing...</span>
        </>
      ) : label}
    </button>
  )
}

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { FormField } from '@/components/forms/FormField'


function JoinGroupContent() {
   const searchParams = useSearchParams()
   const error = searchParams?.get('error')

  return (
    <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem' }}>
       {/* Error Handling Feedback Component */}
       {error && <TransientError message={error} />}
       
       <div style={{ display: 'flex', gap: '2rem', width: '100%', maxWidth: '800px', flexWrap: 'wrap' }}>
          
          {/* Create Group Route */}
          <div className="auth-card" style={{ flex: '1 1 300px', margin: 0, borderRadius: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                 <Plus size={20} color="var(--brand)" />
                 <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create Team</h2>
             </div>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                 Start a new workspace for your academic module or project.
              </p>
             <form action={createGroup}>
                <FormField label="Workspace Name:" required>
                  <input id="name" name="name" type="text" placeholder="e.g. Apollo Project" required style={{ borderRadius: '12px' }} />
                </FormField>
                <FormField label="Module Code (e.g. CS50):" required>
                  <input id="module_code" name="module_code" type="text" placeholder="e.g. CS-501-A" required style={{ borderRadius: '12px' }} />
                </FormField>
                <FormField label="Access Password:" required>
                  <input id="create_join_password" name="join_password" type="password" placeholder="Set a workspace password" required style={{ borderRadius: '12px' }} />
                </FormField>
                <FormField label="Max Capacity:" required>
                  <input id="capacity" name="capacity" type="number" min={2} max={100} defaultValue={5} required style={{ borderRadius: '12px' }} />
                </FormField>
                 <SubmitButton label="Create Workspace" />
             </form>
          </div>

          {/* Join Group Route */}
          <div className="auth-card" style={{ flex: '1 1 300px', margin: 0, borderRadius: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Key size={20} color="var(--brand)" />
                 <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Join Team</h2>
              </div>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                 Connect to an existing project team using the module code and password provided by your team lead.
              </p>
             <form action={joinGroup}>
                <FormField label="Module Code:" required>
                  <input id="create_module_code" name="module_code" type="text" placeholder="e.g. CS-501-A" required style={{ borderRadius: '12px' }} />
                </FormField>
                <FormField label="Join Password:" required>
                  <input id="join_password" name="join_password" type="password" placeholder="Enter group password" required style={{ borderRadius: '12px' }} />
                </FormField>
                 <SubmitButton label="Join Team" secondary />
             </form>
          </div>

       </div>
    </main>
  )
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div className="spinner" />
       </div>
    }>
       <JoinGroupContent />
    </Suspense>
  )
}
