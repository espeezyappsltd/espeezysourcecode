import Image from 'next/image';

const games = [
  { name: 'Kanban', img: '/gallery/kanban.svg', link: '/games/kanban' },
  { name: 'Break Room', img: '/gallery/breakroom.svg', link: '/games/breakroom' },
];

export default function GalleryNav() {
  return (
    <nav id="gallery" className="gallery" aria-label="Game gallery">
      {games.map(game => (
        <a key={game.name} href={game.link} className="gallery__item">
          {/* Decorative: the visible label below names the link. */}
          <Image src={game.img} alt="" width={120} height={120} unoptimized />
          <span>{game.name}</span>
        </a>
      ))}
    </nav>
  );
}
