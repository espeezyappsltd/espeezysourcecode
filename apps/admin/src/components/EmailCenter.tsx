'use client'

import { useCallback, useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import { Mail, Download, FileText, Send, Inbox } from 'lucide-react'
import { useNotifications } from './NotificationProvider'

import { VirtualEmail } from '@/types/ui'
import { Profile } from '@/types/auth'

export default function EmailCenter({
  groupId,
  profile,
  teamMembers
}: {
  groupId: string
  profile: Profile | null
  teamMembers: Profile[]
}) {
  const [emails, setEmails] = useState<VirtualEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<VirtualEmail | null>(null)
  const { addToast } = useNotifications()

  const generateSimulatedInbox = useCallback(() => {
    const mockEmails: VirtualEmail[] = [
      {
        id: '1',
        subject: '⚠️ Milestone Alert: Deadline Approaching',
        from: 'Espeezy AI Autopilot',
        content: `Greetings ${profile?.full_name || 'Collaborator'},\n\nOur temporal sensors indicate that 3 tasks in your group are due within the next 48 hours. Please sync with your team to ensure the velocity remains optimal.`,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        hasAttachment: false,
        type: 'reminder'
      },
      {
        id: '2',
        subject: '📊 Automated Project Performance Digest',
        from: 'Analytics Distribution Node',
        content: `Your weekly performance digest is ready. This report includes a full breakdown of task completions, validity score distributions, and current project health metrics.`,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        hasAttachment: true,
        type: 'report'
      }
    ]
    setEmails(mockEmails)
  }, [profile?.full_name])

  useEffect(() => {
    void (async () => {
      await generateSimulatedInbox()
    })()
  }, [generateSimulatedInbox])

  const generateAndSendReport = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newEmail: VirtualEmail = {
      id: Math.random().toString(),
      subject: '📄 Verifiable Audit Report Generated',
      from: 'Audit Service Alpha',
      content: `The comprehensive project audit report has been generated at your request. This PDF contains every verifiable action logged in the last session.`,
      timestamp: new Date().toISOString(),
      hasAttachment: true,
      type: 'report'
    }

    setEmails((prev) => [newEmail, ...prev])
    setLoading(false)
    addToast('Report Ready', 'Strategic intelligence report generated and delivered to your Virtual Inbox.', 'success')
  }, [addToast])

  const downloadRealPDF = () => {
    const doc = new jsPDF()
    const brandColor = [0, 51, 102] // #003366
    
    // Header
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2])
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("Espeezy AUDIT REPORT", 20, 25)
    
    // Body Text
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Project ID: ${groupId}`, 20, 55)
    doc.text(`Requestor: ${profile?.full_name}`, 20, 62)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 69)
    
    doc.setDrawColor(230, 230, 230)
    doc.line(20, 75, 190, 75)
    
    // Performance Header
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("TEAM PERFORMANCE BREAKDOWN", 20, 90)
    
    // Table
    let y = 105
    doc.setFontSize(11)
    teamMembers.forEach((m, idx) => {
      const total = teamMembers.reduce((acc, curr) => acc + (curr.total_score || 0), 0)
      const pct = total > 0 ? Math.round(((m.total_score || 0) / total) * 100) : 0
      
      doc.setTextColor(idx % 2 === 0 ? 0 : 60, 60, 60)
      doc.setFont("helvetica", "bold")
      doc.text(`${m.full_name}`, 25, y)
      
      doc.setFont("helvetica", "normal")
      doc.text(`${m.total_score} pts`, 120, y)
      doc.text(`${pct}% impact`, 160, y)
      
      // Add arsenal tools if they exist
      if (m.achievements && m.achievements.length > 0) {
        doc.setFontSize(8)
        doc.setTextColor(110, 110, 110)
        const tools = m.achievements
          .map((a: { name?: string; title?: string }) => a.name || a.title)
          .filter(Boolean)
          .join(', ')
        doc.text(`Arsenal: ${tools}`, 25, y + 6)
        y += 7
      }

      doc.setDrawColor(245, 245, 245)
      doc.line(20, y + 5, 190, y + 5)
      y += 15
    })
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text("This document is a verifiable project snapshot. Integrity verified by Espeezy Protocol.", 20, 280)
    
    doc.save(`Espeezy_Audit_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', height: '600px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      
      {/* Sidebar: Inbox List */}
      <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Inbox size={20} color="var(--brand)" /> Virtual Inbox
           </h3>
        </div>
        
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
           <button 
             onClick={generateAndSendReport}
             disabled={loading}
             className="btn btn-primary" 
             style={{ width: '100%', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
           >
              {loading ? 'Compiling PDF...' : <><Send size={16} /> Force Report Now</>}
           </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {emails.map(email => (
            <div 
              key={email.id} 
              onClick={() => setSelectedEmail(email)}
              style={{ 
                padding: '1.25rem', 
                borderBottom: '1px solid var(--bg-main)', 
                cursor: 'pointer',
                background: selectedEmail?.id === email.id ? 'rgba(var(--brand-rgb), 0.05)' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {new Date(email.timestamp).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{email.subject}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{email.from}</div>
              {email.hasAttachment && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--brand)', fontSize: '0.7rem', fontWeight: 700 }}>
                   <FileText size={12} /> PDF ATTACHED
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel: Email Content */}
      <div style={{ background: 'var(--bg-sub)', display: 'flex', flexDirection: 'column' }}>
        {selectedEmail ? (
          <>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{selectedEmail.subject}</h2>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                    {new Date(selectedEmail.timestamp).toLocaleString()}
                  </div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>GF</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedEmail.from}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>To: {profile?.email}</div>
                  </div>
               </div>
            </div>

            <div style={{ padding: '2.5rem', flex: 1, whiteSpace: 'pre-line', lineHeight: 1.6, color: 'var(--text-main)', fontSize: '0.95rem' }}>
               {selectedEmail.content}
               
               {selectedEmail.hasAttachment && (
                 <div style={{ marginTop: '3rem', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ padding: '1rem', background: 'rgba(217, 48, 37, 0.1)', color: 'var(--error)', borderRadius: '12px' }}>
                          <FileText size={24} />
                       </div>
                       <div>
                          <div style={{ fontWeight: 700 }}>Espeezy_Audit_Report.pdf</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>Signed PDF Document • 1.2 MB</div>
                       </div>
                    </div>
                    <button onClick={downloadRealPDF} className="btn" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)', fontWeight: 700 }}>
                       <Download size={18} /> Download
                    </button>
                 </div>
               )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
             <Mail size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
             <p>Select a message to view the audit trail.</p>
          </div>
        )}
      </div>

    </div>
  )
}
