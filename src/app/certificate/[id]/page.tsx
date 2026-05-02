/**
 * Public certificate verification page
 * URL: /certificate/[id]
 *
 * Anyone with the certificate ID can verify authenticity and download the PDF.
 */
import { notFound } from 'next/navigation'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import CertificateViewer from './CertificateViewer'

interface Props {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://espeezy.com'

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  return {
    title: 'Certificate Verification — Espeezy',
    description: `Verify the authenticity of Espeezy certificate ${id}`,
  }
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const svc = await createAdminClient()

  const { data: cert } = await svc
    .from('certificates')
    .select('id, user_id, program_name, issue_date, graduation_year, gpa, achievements, blockchain_hash, revoked, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!cert) notFound()

  const { data: profile } = await svc
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', cert.user_id)
    .maybeSingle()

  const displayName: string = profile?.display_name ?? 'Scholar'

  return (
    <CertificateViewer
      cert={{
        id: cert.id,
        programName: cert.program_name,
        issueDate: cert.issue_date,
        graduationYear: cert.graduation_year ?? null,
        gpa: cert.gpa ?? null,
        achievements: cert.achievements ?? [],
        blockchainHash: cert.blockchain_hash ?? null,
        revoked: cert.revoked,
      }}
      displayName={displayName}
      avatarUrl={profile?.avatar_url ?? null}
      downloadUrl={`${APP_URL}/api/student/certificate/${cert.id}/pdf`}
    />
  )
}
