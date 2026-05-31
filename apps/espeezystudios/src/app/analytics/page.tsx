import StudioPageShell from '../../components/StudioPageShell'
import StudioAnalyticsKpis from '../../components/StudioAnalyticsKpis'
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
      <StudioAnalyticsKpis />
      <DashboardAnalytics />
      <DashboardAnalyticsAdvanced />
      <DashboardCustomAnalytics />
    </StudioPageShell>
  )
}
