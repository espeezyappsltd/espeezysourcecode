import { STUDIO_PAGE_COPY } from '@/lib/studio/ui-copy'
import StudioPageShell from '../../components/StudioPageShell'
import StaffLobby from '../../components/StaffLobby'
import ProjectCategories from '../../components/ProjectCategories'

export default function TeamPage() {
  return (
    <StudioPageShell
      title="Team"
      description={STUDIO_PAGE_COPY.team}
      wide
    >
      <StaffLobby />
      <ProjectCategories />
    </StudioPageShell>
  )
}
