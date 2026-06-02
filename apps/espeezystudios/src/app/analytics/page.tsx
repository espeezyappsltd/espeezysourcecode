import { STUDIO_PAGE_COPY } from '@/lib/studio/ui-copy'
import StudioPageShell from '../../components/StudioPageShell'
import DashboardAnalytics from '../../components/DashboardAnalytics'
import DashboardAnalyticsAdvanced from '../../components/DashboardAnalyticsAdvanced'
import DashboardCustomAnalytics from '../../components/DashboardCustomAnalytics'

export default function AnalyticsPage() {
  return (
    <StudioPageShell
      title="Analytics"
      description={STUDIO_PAGE_COPY.analytics}
      wide
    >
      <DashboardAnalytics />
      <DashboardAnalyticsAdvanced />
      <DashboardCustomAnalytics />
    </StudioPageShell>
  )
}
