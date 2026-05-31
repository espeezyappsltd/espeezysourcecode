import StudioPageShell from '../../components/StudioPageShell'
import StaffLobby from '../../components/StaffLobby'
import ProjectCategories from '../../components/ProjectCategories'

export default function TeamPage() {
  return (
    <StudioPageShell
      title="Team"
      description="Studio roster, roles, and project lanes your crew owns."
      wide
    >
      <StaffLobby />
      <ProjectCategories />
    </StudioPageShell>
  )
}
