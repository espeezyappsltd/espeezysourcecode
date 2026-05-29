import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Espeezy Articles</h1>
      <p>Welcome to the public articles/blog section.</p>
      <Link href="/admin">Go to Admin Panel</Link>
    </main>
  );
}
