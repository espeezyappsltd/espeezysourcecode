import StudioPageShell from '../components/StudioPageShell'
import { STUDIO_PAGE_COPY } from '@/lib/studio/ui-copy'
import DashboardMetrics from '../components/DashboardMetrics'
import DashboardQuickActions from '../components/DashboardQuickActions'
import DashboardProgressBars from '../components/DashboardProgressBars'
import DashboardAdvancedActions from '../components/DashboardAdvancedActions'

export default function HomePage() {
  return (
    <StudioPageShell
      title="Dashboard"
      description={STUDIO_PAGE_COPY.home}
      wide
      centered
    >
      <DashboardMetrics />
      <DashboardQuickActions />
      <DashboardProgressBars />
      <DashboardAdvancedActions />
    </StudioPageShell>
  )
}
