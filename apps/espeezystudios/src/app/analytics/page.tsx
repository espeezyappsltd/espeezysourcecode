import StudioPageShell from '../../components/StudioPageShell'
import DashboardAnalytics from '../../components/DashboardAnalytics'
import DashboardAnalyticsAdvanced from '../../components/DashboardAnalyticsAdvanced'
import DashboardCustomAnalytics from '../../components/DashboardCustomAnalytics'

export default function AnalyticsPage() {
  return (
    <StudioPageShell
      title="Analytics"
      description="Charts, trends, and custom metrics for studio operations."
      wide
    >
      <DashboardAnalytics />
      <DashboardAnalyticsAdvanced />
      <DashboardCustomAnalytics />
    </StudioPageShell>
  )
}
