import Image from 'next/image';

const games = [
  { name: 'Kanban', img: '/gallery/kanban.png', link: '/games/kanban' },
  { name: 'Hustle', img: '/gallery/hustle.png', link: '/games/hustle' },
  { name: 'Break Room', img: '/gallery/breakroom.png', link: '/games/breakroom' },
];

export default function GalleryNav() {
  return (
    <nav style={{ display: 'flex', gap: 24, margin: '24px 0' }}>
      {games.map(game => (
        <a key={game.name} href={game.link} style={{ textAlign: 'center' }}>
          <Image src={game.img} alt={game.name} width={120} height={120} style={{ borderRadius: 12 }} />
          <div>{game.name}</div>
        </a>
      ))}
    </nav>
  );
}
