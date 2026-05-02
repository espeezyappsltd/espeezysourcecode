'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Download, CheckCircle2, AlertTriangle, Sparkles, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CertData {
  id: string
  programName: string
  issueDate: string
  graduationYear: number | null
  gpa: number | null
  achievements: string[]
  blockchainHash: string | null
  revoked: boolean
}

interface Props {
  cert: CertData
  displayName: string
  avatarUrl: string | null
  downloadUrl: string
}

export default function CertificateViewer({ cert, displayName, avatarUrl, downloadUrl }: Props) {
  const issueDate = new Date(cert.issueDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const isValid = !cert.revoked

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #06100d 0%, #0a0a0a 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '4rem 1.5rem',
    }}>
      {/* Nav */}
      <Link href="/" style={{ position: 'fixed', top: '1.25rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', zIndex: 100 }}>
        <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={14} color="white" />
        </div>
        <span style={{ color: 'white', fontWeight: 950, fontSize: '0.9rem', letterSpacing: '-0.03em' }}>Espeezy</span>
      </Link>

      <div style={{ width: '100%', maxWidth: '680px', marginTop: '2rem' }}>
        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.875rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem',
            background: isValid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isValid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          {isValid
            ? <ShieldCheck size={20} color="#10b981" />
            : <AlertTriangle size={20} color="#ef4444" />}
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: isValid ? '#10b981' : '#ef4444' }}>
              {isValid ? 'Certificate Verified — Authentic' : 'Certificate Revoked'}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
              {isValid
                ? `Issued by Espeezy · ID ${cert.id}`
                : 'This certificate is no longer valid'}
            </p>
          </div>
        </motion.div>

        {/* Certificate card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header strip */}
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.04) 100%)', padding: '2.5rem 2.5rem 2rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {avatarUrl
              ? <Image src={avatarUrl} alt={displayName} width={72} height={72} style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(16,185,129,0.4)', marginBottom: '1rem' }} />
              : (
                <div style={{ width: '72px', height: '72px', background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '3px solid rgba(16,185,129,0.3)', fontSize: '28px' }}>
                  🎓
                </div>
              )}
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(16,185,129,0.8)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Certificate of Completion</p>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>{displayName}</h1>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#10b981', letterSpacing: '-0.02em' }}>{cert.programName}</h2>
          </div>

          {/* Details */}
          <div style={{ padding: '1.75rem 2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Issue Date</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{issueDate}</p>
              </div>
              {cert.graduationYear && (
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Graduation Year</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{cert.graduationYear}</p>
                </div>
              )}
              {cert.gpa && (
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>GPA</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{cert.gpa.toFixed(2)}</p>
                </div>
              )}
            </div>

            {cert.achievements.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Achievements</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {cert.achievements.map((a, i) => (
                    <span key={i} style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hash */}
            {cert.blockchainHash && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 0.3rem', fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Integrity Hash (SHA-256)</p>
                <code style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all' }}>{cert.blockchainHash}</code>
              </div>
            )}

            {/* Actions */}
            {isValid && (
              <a
                href={downloadUrl}
                download
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#0a0a0a', textDecoration: 'none', padding: '1rem',
                  borderRadius: '14px', fontWeight: 950, fontSize: '0.9rem',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                }}
              >
                <Download size={18} /> Download PDF Certificate
              </a>
            )}
          </div>
        </motion.div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>
          This certificate was issued by <a href="https://espeezy.com" style={{ color: 'rgba(16,185,129,0.6)', textDecoration: 'none' }}>espeezy.com</a> and is tamper-evident.
        </p>
      </div>
    </div>
  )
}
