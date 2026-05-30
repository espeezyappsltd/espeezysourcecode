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

      <div style={{ textAlign: 'center', fontSize: '1.25rem', color: '#4b5563', marginBottom: '2rem', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6', padding: '0 1rem' , textShadow: '0 1px 6px #6366f122' , fontStyle: 'italic', alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <p>Welcome to the Espeezy Studios dashboard! <br /> 
          Explore our current ongoing projects, track progress, and manage your team all in one place.</p>
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
        
      </div>
      
    </>
  );
}
