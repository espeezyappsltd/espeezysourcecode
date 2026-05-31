import StudioPageShell from '../../components/StudioPageShell'
import JobsList from '../../components/jobs/JobsList'

export default function JobsPage() {
  return (
    <StudioPageShell
      title="Jobs"
      description="Professional project delivery — timeline, budget, milestones, PRD, and client invoicing."
      wide
    >
      <JobsList />
    </StudioPageShell>
  )
}
