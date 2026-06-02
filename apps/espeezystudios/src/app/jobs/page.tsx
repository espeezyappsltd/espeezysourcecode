import StudioPageShell from '../../components/StudioPageShell'
import { STUDIO_PAGE_COPY } from '@/lib/studio/ui-copy'
import JobsList from '../../components/jobs/JobsList'

export default function JobsPage() {
  return (
    <StudioPageShell title="Projects" description={STUDIO_PAGE_COPY.jobs} wide>
      <JobsList />
    </StudioPageShell>
  )
}
