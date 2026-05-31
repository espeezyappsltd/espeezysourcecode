import StudioPageShell from '../../components/StudioPageShell'
import JobsDashboard from '../../components/JobsDashboard'

export default function JobsPage() {
  return (
    <StudioPageShell
      title="Jobs"
      description="Live job queue and delivery status across studio work."
      wide
    >
      <JobsDashboard />
    </StudioPageShell>
  )
}
