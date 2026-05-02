'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TaskModalProps } from '@/types/ui'
import { Profile } from '@/types/auth'
import { TaskStatus, Artifact, TaskCategory } from '@/types/database'
import { X, Trash2, ExternalLink, ThumbsUp, FileUp, Link as LinkIcon, Check } from 'lucide-react'
import { logActivity } from '@/utils/logging'
import { taskSchema } from '@/utils/validation'

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done']
const CATEGORIES: TaskCategory[] = [
  'Implementation', 
  'Architecture', 
  'UX/UI Design', 
  'Quality Assurance', 
  'Research', 
  'Mentorship', 
  'Documentation', 
  'DevOps', 
  'Ethics & Legal'
]
import { db, auth, storage } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  setDoc,
  orderBy
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function TaskModal({ 
  task, 
  groupId, 
  onClose,
  onRefresh,
  onTaskSaved,
  initialDueDate,
  onlineUserIds
}: TaskModalProps) {
  const router = useRouter()

  const onlineUsers = onlineUserIds || new Set<string>()
  const isEditMode = !!task

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'To Do')
  const [category, setCategory] = useState<TaskCategory>(task?.category || 'Implementation')
  const [assignees, setAssignees] = useState<string[]>(task?.assignees || [])
  const [dueDate, setDueDate] = useState<string>(
    task?.due_date 
      ? task.due_date.substring(0, 10) 
      : initialDueDate 
        ? initialDueDate 
        : ''
  )
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Evidence Logic
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [evidenceLoading, setEvidenceLoading] = useState(isEditMode)
  const [newUrl, setNewUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setCurrentUser(auth.currentUser)
    
    // Fetch members real-time
    const q = query(collection(db, 'profiles'), where('group_id', '==', groupId))
    const unsub = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)))
    })

    return () => unsub()
  }, [groupId])

  useEffect(() => {
    if (!isEditMode || !task) return

    const q = query(
      collection(db, 'artifacts'), 
      where('task_id', '==', task.id),
      orderBy('created_at', 'desc')
    )
    
    const unsub = onSnapshot(q, (snap) => {
      setArtifacts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Artifact)))
      setEvidenceLoading(false)
    })

    return () => unsub()
  }, [task?.id, isEditMode])

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required.")
      return
    }

    setLoading(true)
    const payloadTask = {
      title: title.trim(),
      description,
      status,
      category,
      assignees,
      group_id: groupId,
      due_date: dueDate ? new Date(dueDate).toISOString() : null
    }

    // 1. INDUSTRY GRADE VALIDATION
    const validation = taskSchema.safeParse(payloadTask)
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      setLoading(false)
      return
    }

    const payload = {
      action: isEditMode ? 'update' : 'create',
      task: {
        id: task?.id,
        ...payloadTask
      }
    }

    try {
      const response = await fetch('/api/task/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save task via workflow.')
      }

      // If the workflow is still running, give Supabase a brief window before fetching.
      if (data?.status && ['running', 'pending'].includes(data.status)) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      await onRefresh()
      await onTaskSaved?.()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error'
      setError(`Failed to save task: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!title.trim()) {
      setAiError('Give the task a title first so AI can generate a good description.')
      return
    }

    setAiLoading(true)
    setAiError(null)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          category,
          dueDate,
          existingDescription: description
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate AI description.')
      }

      setDescription(data.description)
      setAiError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unable to generate AI description.'
      setAiError(message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!confirm("Are you absolutely sure you want to permanently delete this task?")) return

    setLoading(true)
    try {
      await deleteDoc(doc(db, 'tasks', task.id))
      await onRefresh()
      await onTaskSaved?.()

      if (currentUser) {
        logActivity(
          currentUser.uid,
          groupId,
          'task_deleted',
          `Deleted task: ${task.title}`
        )
      }
      onClose()
    } catch (err: any) {
      setError(`Failed to delete: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleMemberAssignment = async (memberId: string) => {
    const isCurrentlyAssigned = assignees.includes(memberId)
    const newAssignees = isCurrentlyAssigned 
      ? assignees.filter(id => id !== memberId) 
      : [...assignees, memberId]
      
    setAssignees(newAssignees)

    if (isEditMode && task) {
       setLoading(true)
       try {
         await updateDoc(doc(db, 'tasks', task.id), { assignees: newAssignees })
         onRefresh()
       } catch (err: any) {
         setError(`Failed to update assignment: ${err.message}`)
         setAssignees(task.assignees || [])
       }
       setLoading(false)
    }
  }

  const handleUploadEvidence = async () => {
    if (!newUrl || !task) return
    setUploading(true)
    setError(null)
    
    if (!currentUser) {
      setError("Not authenticated.")
      setUploading(false)
      return
    }

    try {
      await addDoc(collection(db, 'artifacts'), {
        task_id: task.id,
        file_url: newUrl,
        uploaded_by: currentUser.uid,
        endorsements_count: 0,
        created_at: new Date().toISOString()
      })

      logActivity(
        currentUser.uid,
        groupId,
        'artifact_uploaded',
        `Attached a link to task`,
        { task_id: task.id }
      )
      setNewUrl('')
    } catch (err: any) {
      setError(`Failed to attach evidence: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handlePhysicalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     try {
       const file = e.target.files?.[0]
       if (!file || !task || !currentUser) return
       setUploading(true)
       setError(null)
       
       const fileName = `evidence-${task.id}-${Date.now()}-${file.name}`
       const fileRef = ref(storage, `Espeezy_assets/${fileName}`)
       
       await uploadBytes(fileRef, file)
       const publicUrl = await getDownloadURL(fileRef)
       
       await addDoc(collection(db, 'artifacts'), {
         task_id: task.id,
         file_url: publicUrl,
         uploaded_by: currentUser.uid,
         endorsements_count: 0,
         created_at: new Date().toISOString()
       })
     } catch (err: any) {
       setError(`File upload failed: ${err.message}`)
     } finally {
       setUploading(false)
     }
  }

  const handleDeleteArtifact = async (artifactId: string) => {
    try {
      await deleteDoc(doc(db, 'artifacts', artifactId))
      if (currentUser) {
        logActivity(
          currentUser.uid,
          groupId,
          'artifact_uploaded',
          `Removed an attachment from task`,
          { task_id: task?.id || 'deleted' }
        )
      }
    } catch (err: any) {
      setError(`Failed to delete artifact: ${err.message}`)
    }
  }

  const handleEndorse = async (artifactId: string, currentCount: number) => {
    try {
      await updateDoc(doc(db, 'artifacts', artifactId), { endorsements_count: currentCount + 1 })
    } catch (err: any) {
      setError(`Failed to endorse: ${err.message}`)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content task-modal-responsive" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          padding: 0, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column', 
          width: '95%',
          maxWidth: '650px',
          height: 'auto',
          maxHeight: 'calc(100dvh - 8rem)'
        }}
      >
        
        {/* Sleek Google-style Header */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: 'var(--bg-sub)',
          flexShrink: 0
        }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isEditMode ? 'Edit Task' : 'New Task'}
            {isEditMode && assignees.length > 0 && (
               <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                 <div style={{ display: 'flex', marginRight: '0.5rem' }}>
                   {assignees.slice(0, 3).map((userId, i) => {
                     const m = members.find(p => p.id === userId);
                     return (
                       <div 
                         key={userId} 
                         onClick={() => router.push(`/dashboard/network/profile/${userId}`)}
                         style={{ 
                           width: '24px', height: '24px', borderRadius: '50%', 
                           border: '2px solid var(--bg-sub)', marginLeft: i === 0 ? 0 : '-8px',
                           backgroundColor: 'var(--brand)', cursor: 'pointer', overflow: 'hidden',
                           zIndex: 10 - i
                         }}
                         title={m?.full_name || 'Assigned User'}
                       >
                         {m?.avatar_url ? (
                           <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>
                             {(m?.full_name || '?')[0]}
                           </div>
                         )}
                       </div>
                     )
                   })}
                   {assignees.length > 3 && (
                     <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--bg-sub)', marginLeft: '-8px', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, zIndex: 0 }}>
                       +{assignees.length - 3}
                     </div>
                   )}
                 </div>
                 <span className="badge hide-tiny" style={{ backgroundColor: 'var(--brand)', color: 'white', fontSize: '0.7rem' }}>
                   {assignees.length} Assigned
                 </span>
               </div>
            )}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}>
             <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Task Name</label>
              <input 
                className="form-input" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="What needs to be done?"
                autoFocus
                style={{ fontSize: '1rem' }} // Better for mobile zoom
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Description</label>
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !title.trim()}
                  className="secondary-button"
                  style={{
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.85rem',
                    borderRadius: '999px',
                    minWidth: '124px',
                    opacity: aiLoading || !title.trim() ? 0.7 : 1
                  }}
                >
                  {aiLoading ? 'Generating…' : 'AI Assist'}
                </button>
              </div>
              <textarea 
                className="form-input" 
                value={description || ''} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Add more details about this task..."
                rows={3}
                style={{ resize: 'vertical', fontSize: '0.95rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                  Use AI Assist to generate a polished description from the task title.
                </span>
                {aiError && (
                  <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{aiError}</span>
                )}
              </div>
            </div>

             <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
               <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                 <label className="form-label">Status</label>
                 <select className="form-input" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                   {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>
               
               <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={category} onChange={e => setCategory(e.target.value as TaskCategory)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
               
               <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                 <label className="form-label" style={{ color: 'var(--error)' }}>Due Date</label>
                 <input 
                   type="date"
                   className="form-input"
                   value={dueDate}
                   onChange={e => setDueDate(e.target.value)}
                   style={{ borderColor: dueDate ? 'var(--border)' : 'var(--error)' }}
                 />
               </div>
             </div>
            
            {/* COLLABORATOR SELECTION GRID */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Assignments</label>
                <div style={{ position: 'relative', width: '100%', maxWidth: '220px' }}>
                  <input 
                    type="text" 
                    placeholder="Search collaborators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                      width: '100%', 
                      fontSize: '0.75rem', 
                      padding: '0.4rem 0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border)', 
                      background: 'var(--bg-main)' 
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', padding: '0.25rem' }}>
                {members.length === 0 ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '12px' }} />
                  ))
                ) : (
                  members
                    .filter(m => 
                      !searchQuery || 
                      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      m.school_id?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(member => {
                    const isAssigned = assignees.includes(member.id)
                    const isOnline = onlineUsers.has(member.id)
                    const initials = member.full_name ? member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'

                    return (
                      <div 
                        key={member.id}
                        onClick={() => toggleMemberAssignment(member.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: '10px',
                          backgroundColor: isAssigned ? 'rgba(var(--brand-rgb), 0.05)' : 'transparent',
                          border: isAssigned ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative'
                        }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url} 
                              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                              alt={member.full_name || 'Member'}
                            />
                          ) : (
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                              {initials}
                            </div>
                          )}
                          {isOnline && (
                            <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', border: '1.5px solid var(--surface)' }} />
                          )}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{member.full_name?.split(' ')[0]}</div>
                        </div>
                        {isAssigned && (
                          <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Peer Verification Sub-Panel (Only in Edit Mode) */}
          {isEditMode && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                 <LinkIcon size={16} color="var(--brand)" />
                 <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>Evidence & Links</h3>
               </div>
               <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>Add verifiable work links or architectural proof.</p>

               <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                 <input 
                   type="url" 
                   className="form-input" 
                   placeholder="Figma / Docs / GitHub URL"
                   value={newUrl}
                   onChange={(e) => setNewUrl(e.target.value)}
                   style={{ flex: '1 1 200px' }}
                 />
                 <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleUploadEvidence} disabled={uploading || !newUrl} style={{ flex: 1 }}>
                        {uploading ? 'Adding...' : 'Attach'}
                    </button>
                    
                    <div style={{ position: 'relative', flex: 1 }}>
                        <button className="btn btn-ghost btn-sm" disabled={uploading} style={{ width: '100%', borderColor: 'var(--brand)', color: 'var(--brand)' }}>
                           <FileUp size={14} /> Upload
                        </button>
                        <input 
                          type="file" 
                          onChange={handlePhysicalUpload} 
                          disabled={uploading} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                        />
                    </div>
                 </div>
               </div>

                <div>
                   {evidenceLoading || uploading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[1].map(i => (
                          <div key={i} className="skeleton" style={{ height: '50px', borderRadius: '12px' }} />
                        ))}
                      </div>
                   ) : artifacts.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-sub)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                         <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>No verifiable evidence attached yet.</p>
                      </div>
                  ) : (
                    artifacts.map(artifact => {
                      const isOwner = currentUser?.id === artifact.uploaded_by;
                      return (
                        <div key={artifact.id} className="artifact-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', background: 'var(--bg-main)' }}>
                           <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                             <a href={artifact.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                               <ExternalLink size={12} />
                               View Attachment
                             </a>
                           </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                             <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => handleEndorse(artifact.id, artifact.endorsements_count)}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                             >
                                <ThumbsUp size={12} />
                                {artifact.endorsements_count}
                             </button>
                            
                             {isOwner && (
                                <button 
                                 onClick={() => handleDeleteArtifact(artifact.id)}
                                 style={{ background: 'none', border: 'none', color: 'var(--error)', padding: '4px', cursor: 'pointer' }}
                                >
                                   <Trash2 size={14} />
                                </button>
                             )}
                          </div>
                       </div>
                      )
                    })
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '0.75rem', 
          backgroundColor: 'var(--bg-sub)',
          flexShrink: 0,
          flexWrap: 'wrap'
        }}>
           {isEditMode && (
             <button className="btn btn-sm btn-inline" onClick={handleDelete} disabled={loading} style={{ color: 'var(--error)', backgroundColor: 'transparent', marginRight: 'auto' }}>
               <Trash2 size={14} /> Delete
             </button>
           )}
           <button className="btn btn-secondary btn-sm btn-inline" onClick={onClose}>Cancel</button>
           <button className="btn btn-primary btn-sm btn-inline" onClick={handleSave} disabled={loading}>
             {loading ? 'Saving...' : 'Save Task'}
           </button>
        </div>

        <style jsx>{`
          @media (max-width: 480px) {
            .hide-tiny { display: none; }
          }
        `}</style>
      </div>
    </div>
  )
}
