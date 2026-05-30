import DashboardCustomAnalytics from '../components/DashboardCustomAnalytics';
  <DashboardCustomAnalytics />


import DashboardMetrics from '../components/DashboardMetrics';
import DashboardQuickActions from '../components/DashboardQuickActions';
import DashboardProgressBars from '../components/DashboardProgressBars';
import DashboardAnalytics from '../components/DashboardAnalytics';
import DashboardAnalyticsAdvanced from '../components/DashboardAnalyticsAdvanced';
import DashboardAdvancedActions from '../components/DashboardAdvancedActions';
import GalleryNav from '../components/GalleryNav';
import ProjectCategories from '../components/ProjectCategories';
import StaffLobby from '../components/StaffLobby';
import JobsDashboard from '../components/JobsDashboard';

export default function Home() {
  return (
    <>
      <h1 style={{ textAlign: 'center', fontWeight: 900, fontSize: '2.5rem', margin: '2rem 0 1.5rem 0', letterSpacing: '-1px', textShadow: '0 2px 12px #6366f122' }}>
        Espeezy Studios
      </h1>
      <DashboardMetrics />
      <DashboardQuickActions />
      <DashboardAdvancedActions />
      <DashboardProgressBars />
      <DashboardAnalytics />
      <DashboardAnalyticsAdvanced />
      <GalleryNav />
      <ProjectCategories />
      <StaffLobby />
      <JobsDashboard />
    </>
  );
}
