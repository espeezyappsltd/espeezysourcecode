import StudioPageShell from '../components/StudioPageShell'
import DashboardMetrics from '../components/DashboardMetrics'
import DashboardQuickActions from '../components/DashboardQuickActions'
import DashboardProgressBars from '../components/DashboardProgressBars'
import DashboardAdvancedActions from '../components/DashboardAdvancedActions'

export default function HomePage() {
  return (
    <StudioPageShell
      title="Espeezy Studios"
      description="Welcome back — snapshot of projects, jobs, and quick actions for your studio."
      wide
    >
      <DashboardMetrics />
      <DashboardQuickActions />
      <DashboardProgressBars />
      <DashboardAdvancedActions />
    </StudioPageShell>
  )
}
