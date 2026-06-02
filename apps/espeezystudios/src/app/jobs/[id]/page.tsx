import StudioPageShell from '@/components/StudioPageShell'
import { STUDIO_PAGE_COPY } from '@/lib/studio/ui-copy'
import JobWorkspace from '@/components/jobs/JobWorkspace'
type Props = { params: Promise<{ id: string }> }

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <StudioPageShell
      title="Project workspace"
      description={STUDIO_PAGE_COPY.jobsWorkspace}
      wide
    >
      <JobWorkspace jobId={id} />
    </StudioPageShell>
  )
}
