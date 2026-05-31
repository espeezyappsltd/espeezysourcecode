import StudioPageShell from '@/components/StudioPageShell'
import JobWorkspace from '@/components/jobs/JobWorkspace'

type Props = { params: Promise<{ id: string }> }

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <StudioPageShell
      title="Project workspace"
      description="Timeline, budget, milestones, PRD, and client delivery."
      wide
    >
      <JobWorkspace jobId={id} />
    </StudioPageShell>
  )
}
