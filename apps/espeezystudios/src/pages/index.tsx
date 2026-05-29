
import GalleryNav from '../components/GalleryNav';
import ProjectCategories from '../components/ProjectCategories';
import StaffLobby from '../components/StaffLobby';
import JobsDashboard from '../components/JobsDashboard';

export default function Home() {
  return (
    <>
      <h1>Espeezy Studios</h1>
      <GalleryNav />
      <ProjectCategories />
      <StaffLobby />
      <JobsDashboard />
    </>
  );
}
