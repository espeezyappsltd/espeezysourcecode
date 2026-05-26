import GalleryNav from '../components/GalleryNav';
import ProjectCategories from '../components/ProjectCategories';
import StaffLobby from '../components/StaffLobby';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Espeezy Studios</h1>
      <GalleryNav />
      <ProjectCategories />
      <StaffLobby />
    </main>
  );
}
