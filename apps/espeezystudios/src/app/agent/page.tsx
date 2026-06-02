'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Bot, Briefcase, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useJobSchemaCapabilities } from '@/hooks/useJobSchemaCapabilities'
import { useStudioEditor } from '@/hooks/useStudioEditor'
import type { StudioJob } from '@/lib/jobs/types'

export default function AgentPage() {
  const { canEdit, loading: authLoading } = useStudioEditor()
  const { capabilities, loading: capsLoading } = useJobSchemaCapabilities()
  const [jobs, setJobs] = useState<StudioJob[]>([])
  const [title, setTitle] = useState('Next.js client app build')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [prompt, setPrompt] = useState(
    'Build a production-ready Next.js client application with Supabase client database integration, user authentication, and a responsive landing page. Follow the steps to create pages, data access, styling, and deployment instructions.',
  )
  const [status, setStatus] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
    setJobs((data ?? []) as StudioJob[])
  }, [])

  useEffect(() => {
    const tid = setTimeout(() => {
      void fetchJobs()
    }, 0)

    return () => clearTimeout(tid)
  }, [fetchJobs])

  const agentJobs = useMemo(
    () => jobs.filter((job) => job.description?.startsWith('Agent task:') || job.requirements_text?.includes('Build a production-ready Next.js client application')),
    [jobs],
  )

  async function createAgentTask() {
    if (!capabilities) {
      setStatus('Waiting for schema capabilities to load.')
      return
    }
    if (!title.trim()) {
      setStatus('Please enter a project title.')
      return
    }
    if (!prompt.trim()) {
      setStatus('Please enter the build prompt for the agent.')
      return
    }

    setCreating(true)
    setStatus(null)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          clientName: clientName.trim() || null,
          clientEmail: clientEmail.trim() || null,
          prompt: prompt.trim(),
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        setStatus(result.error || 'Unable to create the agent task.')
        return
      }

      setStatus('Agent task created and fulfillment started. Refreshing the list now.')
      await fetchJobs()
      setPrompt('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to create the agent task.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="studio-page agent-page">
      <section className="studio-panel">
        <div className="studio-panel__heading">
          <div>
            <h1><Bot size={28} /> Agent task builder</h1>
            <p className="studio-muted">
              Create on-demand studio tasks for client projects. The agent task captures prompt requirements and saves a job record in the studio Supabase database.
            </p>
          </div>
        </div>

        {status ? <p className="studio-success">{status}</p> : null}

        {authLoading || capsLoading ? (
          <div className="studio-muted">
            <Loader2 className="spin" size={18} /> Loading agent tools…
          </div>
        ) : !canEdit ? (
          <p className="studio-muted">Sign in with your studio account to create agent tasks.</p>
        ) : (
          <div className="studio-grid">
            <div className="studio-card">
              <label className="studio-crud__field">
                <span>Project title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Client site build name" />
              </label>
              <label className="studio-crud__field">
                <span>Client name</span>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="EvryBady, SavannahBG, etc." />
              </label>
              <label className="studio-crud__field">
                <span>Client email</span>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </label>
              <label className="studio-crud__field">
                <span>Agent prompt</span>
                <textarea
                  rows={8}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the Next.js client app requirements, styling, pages, and Supabase integration."
                />
              </label>
              <div className="studio-actions-row">
                <button type="button" className="studio-btn" disabled={creating} onClick={() => void createAgentTask()}>
                  {creating ? (
                    <>
                      <Loader2 className="spin" size={16} aria-hidden /> Creating…
                    </>
                  ) : (
                    <><Plus size={16} aria-hidden /> Create agent task</>
                  )}
                </button>
              </div>
            </div>

            <div className="studio-card studio-card--secondary">
              <div className="studio-card__meta">
                <span><Briefcase size={16} /> {agentJobs.length} agent tasks</span>
                <span><Mail size={16} /> Uses studio Supabase clientDB</span>
              </div>
              {agentJobs.length === 0 ? (
                <p className="studio-muted">No agent tasks have been created yet.</p>
              ) : (
                <ul className="studio-list">
                  {agentJobs.map((job) => (
                    <li key={job.id} className="studio-list__item">
                      <a href={`/jobs/${job.id}`} className="studio-link">
                        {job.title}
                        <span className="studio-list__meta">{job.status}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
